import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const AchievementSchema = z.object({
  achievement_name: z.string().min(1),
  achievement_type: z.string().min(1),
  description: z.string().optional(),
  criteria: z.string().optional(),
  target_value: z.number().optional(),
  current_value: z.number().default(0),
  priority_level: z.enum(['low', 'medium', 'high']).default('medium'),
  celebration_message: z.string().optional()
});

const UpdateAchievementSchema = z.object({
  achievement_name: z.string().min(1).optional(),
  description: z.string().optional(),
  criteria: z.string().optional(),
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
  priority_level: z.enum(['low', 'medium', 'high']).optional(),
  celebration_message: z.string().optional()
});

// GET /api/achievements - Get all user achievements
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const status = req.query.status;
    const type = req.query.type;
    
    let query = 'SELECT * FROM achievements WHERE user_id = ?';
    let params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND achievement_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY priority_level DESC, created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// GET /api/achievements/stats - Get achievement statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_achievements,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_achievements,
        AVG(CASE WHEN target_value > 0 THEN (current_value / target_value) * 100 END) as avg_progress_percentage,
        achievement_type,
        COUNT(*) as type_count
      FROM achievements 
      WHERE user_id = ?
      GROUP BY achievement_type
      ORDER BY type_count DESC
    `, [userId]);
    
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_achievements,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_achievements,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_achievements
      FROM achievements 
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      summary: summary.rows[0],
      by_type: result.rows
    });
  } catch (error) {
    console.error('Error fetching achievement stats:', error);
    res.status(500).json({ error: 'Failed to fetch achievement statistics' });
  }
});

// GET /api/achievements/progress - Get achievements with progress calculation
router.get('/progress', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(`
      SELECT *,
        CASE 
          WHEN target_value > 0 THEN ROUND((current_value / target_value) * 100, 2)
          ELSE 0 
        END as progress_percentage,
        CASE 
          WHEN target_value > 0 AND current_value >= target_value THEN 1
          ELSE 0 
        END as is_target_reached
      FROM achievements 
      WHERE user_id = ? AND status = 'active'
      ORDER BY progress_percentage DESC, priority_level DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ error: 'Failed to fetch achievement progress' });
  }
});

// GET /api/achievements/:id - Get specific achievement
router.get('/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM achievements WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    res.status(500).json({ error: 'Failed to fetch achievement' });
  }
});

// POST /api/achievements - Create new achievement
router.post('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = AchievementSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      achievement_name, 
      achievement_type, 
      description, 
      criteria, 
      target_value, 
      current_value, 
      priority_level,
      celebration_message 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO achievements (
        id, user_id, achievement_name, achievement_type, description, criteria, 
        target_value, current_value, priority_level, celebration_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, achievement_name, achievement_type, description, criteria, target_value, current_value, priority_level, celebration_message]);
    
    const result = await db.query(
      'SELECT * FROM achievements WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

// PUT /api/achievements/:id - Update achievement
router.put('/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const validation = UpdateAchievementSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const updateData = validation.data;
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateFields.push('updated_at = datetime(\'now\')');
    updateValues.push(id, userId);
    
    const result = await db.query(`
      UPDATE achievements 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM achievements WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// POST /api/achievements/:id/progress - Update achievement progress
router.post('/:id/progress', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const { increment, new_value, notes } = req.body;
    
    let updateQuery;
    let updateValues;
    
    if (new_value !== undefined) {
      updateQuery = `
        UPDATE achievements 
        SET current_value = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `;
      updateValues = [new_value, id, userId];
    } else if (increment !== undefined) {
      updateQuery = `
        UPDATE achievements 
        SET current_value = current_value + ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `;
      updateValues = [increment, id, userId];
    } else {
      return res.status(400).json({ error: 'Either increment or new_value must be provided' });
    }
    
    const result = await db.query(updateQuery, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    // Check if achievement is now complete
    const updated = await db.query(`
      SELECT *,
        CASE 
          WHEN target_value > 0 AND current_value >= target_value THEN 1
          ELSE 0 
        END as is_target_reached
      FROM achievements 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    const achievement = updated.rows[0];
    
    // Auto-complete if target reached
    if (achievement.is_target_reached && achievement.status === 'active') {
      await db.query(`
        UPDATE achievements 
        SET status = 'completed', completion_date = datetime('now')
        WHERE id = ? AND user_id = ?
      `, [id, userId]);
      
      achievement.status = 'completed';
      achievement.completion_date = new Date().toISOString();
    }
    
    res.json(achievement);
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    res.status(500).json({ error: 'Failed to update achievement progress' });
  }
});

// POST /api/achievements/:id/complete - Mark achievement as complete
router.post('/:id/complete', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const { completion_notes } = req.body;
    
    const result = await db.query(`
      UPDATE achievements 
      SET status = 'completed', completion_date = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND user_id = ? AND status != 'completed'
    `, [id, userId]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Achievement not found or already completed' });
    }
    
    const updated = await db.query(
      'SELECT * FROM achievements WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error completing achievement:', error);
    res.status(500).json({ error: 'Failed to complete achievement' });
  }
});

// DELETE /api/achievements/:id - Delete achievement
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM achievements WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

export default router;
