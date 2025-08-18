import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const MoodEntrySchema = z.object({
  mood_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood_score: z.number().int().min(1).max(10),
  energy_level: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  motivation_level: z.number().int().min(1).max(10).optional(),
  mood_tags: z.string().optional(),
  notes: z.string().optional(),
  triggers: z.string().optional(),
  coping_strategies_used: z.string().optional()
});

const UpdateMoodEntrySchema = z.object({
  mood_score: z.number().int().min(1).max(10).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  motivation_level: z.number().int().min(1).max(10).optional(),
  mood_tags: z.string().optional(),
  notes: z.string().optional(),
  triggers: z.string().optional(),
  coping_strategies_used: z.string().optional()
});

// GET /api/mood - Get mood entries
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const limit = parseInt(String(req.query.limit || '30')) || 30;
    
    let query = 'SELECT * FROM mood_tracking WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (startDate && endDate) {
      query += ' AND mood_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND mood_date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND mood_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY mood_date DESC LIMIT ?';
    params.push(limit);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// GET /api/mood/latest - Get latest mood entry
router.get('/latest', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? ORDER BY mood_date DESC LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No mood entries found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching latest mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch latest mood entry' });
  }
});

// GET /api/mood/today - Get today's mood entry
router.get('/today', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, today]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No mood entry for today' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching today\'s mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s mood entry' });
  }
});

// GET /api/mood/stats - Get mood statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_score) as avg_mood_score,
        AVG(energy_level) as avg_energy_level,
        AVG(stress_level) as avg_stress_level,
        AVG(motivation_level) as avg_motivation_level,
        MIN(mood_score) as min_mood_score,
        MAX(mood_score) as max_mood_score,
        COUNT(CASE WHEN mood_score >= 7 THEN 1 END) as good_mood_days,
        COUNT(CASE WHEN mood_score <= 4 THEN 1 END) as low_mood_days,
        COUNT(CASE WHEN stress_level >= 7 THEN 1 END) as high_stress_days
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
    `, [userId, startDateStr]);
    
    // Get mood trends (weekly averages)
    const trends = await db.query(`
      SELECT 
        strftime('%Y-%W', mood_date) as week,
        AVG(mood_score) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        COUNT(*) as entries_count
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      GROUP BY strftime('%Y-%W', mood_date)
      ORDER BY week
    `, [userId, startDateStr]);
    
    res.json({
      summary: result.rows[0],
      weekly_trends: trends.rows
    });
  } catch (error) {
    console.error('Error fetching mood stats:', error);
    res.status(500).json({ error: 'Failed to fetch mood statistics' });
  }
});

// GET /api/mood/patterns - Get mood patterns and insights
router.get('/patterns', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '90')) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get day-of-week patterns
    const dayPatterns = await db.query(`
      SELECT 
        CASE strftime('%w', mood_date)
          WHEN '0' THEN 'Sunday'
          WHEN '1' THEN 'Monday'
          WHEN '2' THEN 'Tuesday'
          WHEN '3' THEN 'Wednesday'
          WHEN '4' THEN 'Thursday'
          WHEN '5' THEN 'Friday'
          WHEN '6' THEN 'Saturday'
        END as day_of_week,
        AVG(mood_score) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        COUNT(*) as count
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      GROUP BY strftime('%w', mood_date)
      ORDER BY strftime('%w', mood_date)
    `, [userId, startDateStr]);
    
    // Get common triggers
    const triggers = await db.query(`
      SELECT triggers, COUNT(*) as frequency
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ? AND triggers IS NOT NULL AND triggers != ''
      GROUP BY triggers
      ORDER BY frequency DESC
      LIMIT 10
    `, [userId, startDateStr]);
    
    // Get effective coping strategies
    const copingStrategies = await db.query(`
      SELECT coping_strategies_used, AVG(mood_score) as avg_mood_after, COUNT(*) as usage_count
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ? AND coping_strategies_used IS NOT NULL AND coping_strategies_used != ''
      GROUP BY coping_strategies_used
      ORDER BY avg_mood_after DESC, usage_count DESC
      LIMIT 10
    `, [userId, startDateStr]);
    
    res.json({
      day_of_week_patterns: dayPatterns.rows,
      common_triggers: triggers.rows,
      effective_coping_strategies: copingStrategies.rows
    });
  } catch (error) {
    console.error('Error fetching mood patterns:', error);
    res.status(500).json({ error: 'Failed to fetch mood patterns' });
  }
});

// GET /api/mood/:date - Get mood entry for specific date
router.get('/:date', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await db.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, date]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found for this date' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch mood entry' });
  }
});

// POST /api/mood - Create new mood entry
router.post('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = MoodEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      mood_date, 
      mood_score, 
      energy_level, 
      stress_level, 
      motivation_level, 
      mood_tags, 
      notes, 
      triggers, 
      coping_strategies_used 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO mood_tracking (
        id, user_id, mood_date, mood_score, energy_level, stress_level, 
        motivation_level, mood_tags, notes, triggers, coping_strategies_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, mood_date, mood_score, energy_level, stress_level, motivation_level, mood_tags, notes, triggers, coping_strategies_used]);
    
    const result = await db.query(
      'SELECT * FROM mood_tracking WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Mood entry already exists for this date' });
    }
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// PUT /api/mood/:date - Update mood entry
router.put('/:date', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    const validation = UpdateMoodEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const updateData = validation.data;
    const updateFields: string[] = [];
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
    
    updateValues.push(userId, date);
    
    const result = await db.query(`
      UPDATE mood_tracking 
      SET ${updateFields.join(', ')}
      WHERE user_id = ? AND mood_date = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Mood entry not found for this date' });
    }
    
    const updated = await db.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, date]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating mood entry:', error);
    res.status(500).json({ error: 'Failed to update mood entry' });
  }
});

// DELETE /api/mood/:date - Delete mood entry
router.delete('/:date', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await db.query(
      'DELETE FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, date]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Mood entry not found for this date' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

export default router;
