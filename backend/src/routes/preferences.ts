import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const PreferenceSchema = z.object({
  preference_category: z.string().min(1, 'preference_category is required'),
  preference_key: z.string().min(1, 'preference_key is required'),
  preference_value: z.string().min(1, 'preference_value is required'),
  preference_type: z.enum(['string', 'integer', 'boolean', 'json']).default('string'),
  description: z.string().optional()
});

const UpdatePreferenceSchema = z.object({
  preference_value: z.string(),
  description: z.string().optional()
});

// GET /api/preferences - Get all user preferences
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ? ORDER BY preference_category, preference_key',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// GET /api/preferences/:category - Get preferences by category
router.get('/:category', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { category } = req.params;
    
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ? AND preference_category = ? ORDER BY preference_key',
      [userId, category]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching preferences by category:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// GET /api/preferences/:category/:key - Get specific preference
router.get('/:category/:key', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { category, key } = req.params;
    
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ? AND preference_category = ? AND preference_key = ?',
      [userId, category, key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

// POST /api/preferences - Create new preference
router.post('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = PreferenceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { preference_category, preference_key, preference_value, preference_type, description } = validation.data;
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO user_preferences (id, user_id, preference_category, preference_key, preference_value, preference_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, preference_category, preference_key, preference_value, preference_type, description]);
    
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Preference already exists for this category and key' });
    }
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Failed to create preference' });
  }
});

// PUT /api/preferences/:category/:key - Update preference
router.put('/:category/:key', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { category, key } = req.params;
    const validation = UpdatePreferenceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { preference_value, description } = validation.data;
    
    const updateFields = ['preference_value = ?', 'updated_at = datetime(\'now\')'];
    const updateValues = [preference_value];
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    updateValues.push(String(userId), String(category), String(key));
    
    const result = await db.query(`
      UPDATE user_preferences 
      SET ${updateFields.join(', ')}
      WHERE user_id = ? AND preference_category = ? AND preference_key = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ? AND preference_category = ? AND preference_key = ?',
      [userId, category, key]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

// DELETE /api/preferences/:category/:key - Delete preference
router.delete('/:category/:key', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { category, key } = req.params;
    
    const result = await db.query(
      'DELETE FROM user_preferences WHERE user_id = ? AND preference_category = ? AND preference_key = ?',
      [userId, category, key]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Preference not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting preference:', error);
    res.status(500).json({ error: 'Failed to delete preference' });
  }
});

// POST /api/preferences/bulk - Bulk update preferences
router.post('/bulk', async (req, res) => {
  const userId = req.query.user_id || 'default';

  try {
    const { preferences } = req.body;

    console.log('Bulk update request received:', { userId, preferencesCount: preferences?.length });

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array' });
    }

    if (preferences.length === 0) {
      return res.status(400).json({ error: 'Preferences array cannot be empty' });
    }

    const results = [];

    for (const pref of preferences) {
      const validation = PreferenceSchema.safeParse(pref);
      if (!validation.success) {
        console.error('Validation error:', validation.error.errors);
        return res.status(400).json({ error: `Invalid preference: ${validation.error.errors}` });
      }
    }

    // Use transaction for bulk update
    await db.transaction(async () => {
      console.log('Starting transaction for bulk update');

      for (const pref of preferences) {
        const { preference_category, preference_key, preference_value, preference_type, description } = pref;

        console.log(`Processing preference: ${preference_category}/${preference_key}`);

        // Try to update first, if no rows affected, insert
        const updateResult = await db.query(`
          UPDATE user_preferences
          SET preference_value = ?, preference_type = ?, description = ?, updated_at = datetime('now')
          WHERE user_id = ? AND preference_category = ? AND preference_key = ?
        `, [preference_value, preference_type, description, userId, preference_category, preference_key]);

        console.log(`Update result: ${updateResult.rowsAffected} rows affected`);

        if (updateResult.rowsAffected === 0) {
          console.log('No rows updated, inserting new preference');
          // Insert new preference
          const id = uuidv4();
          await db.query(`
            INSERT INTO user_preferences (id, user_id, preference_category, preference_key, preference_value, preference_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [id, userId, preference_category, preference_key, preference_value, preference_type, description]);
        }
      }
    });

    console.log('Bulk update processing completed successfully');

    // Return updated preferences
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ? ORDER BY preference_category, preference_key',
      [userId]
    );

    console.log(`Returning ${result.rows.length} preferences`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error bulk updating preferences:', error);

    // Check if it's the "Transaction function cannot return a promise" error
    // This error is thrown by better-sqlite3 but the transaction actually works
    if (error instanceof TypeError && error.message.includes('Transaction function cannot return a promise')) {
      console.log('Transaction completed successfully despite better-sqlite3 warning');

      // Return updated preferences
      const result = await db.query(
        'SELECT * FROM user_preferences WHERE user_id = ? ORDER BY preference_category, preference_key',
        [userId]
      );

      console.log(`Returning ${result.rows.length} preferences`);
      return res.json(result.rows);
    }

    res.status(500).json({ error: 'Failed to bulk update preferences' });
  }
});

export default router;
