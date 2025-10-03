import { Router } from 'express';
import { pool } from '../server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CopingStrategySchema = z.object({
  strategy_name: z.string().min(1),
  strategy_category: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
  duration_minutes: z.number().int().min(1).optional(),
  difficulty_level: z.number().int().min(1).max(5).optional(),
  mood_tags: z.string().optional(),
  stress_levels: z.string().optional(),
  triggers: z.string().optional()
});

const StrategyUsageSchema = z.object({
  strategy_id: z.string().uuid(),
  mood_before: z.number().int().min(1).max(10).optional(),
  mood_after: z.number().int().min(1).max(10).optional(),
  stress_before: z.number().int().min(1).max(10).optional(),
  stress_after: z.number().int().min(1).max(10).optional(),
  effectiveness_rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  context: z.string().optional()
});

// GET /api/coping-strategies - Get all coping strategies
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const category = req.query.category;
    const mood = req.query.mood;
    const stressLevel = req.query.stress_level;
    const limit = parseInt(String(req.query.limit || '50')) || 50;
    
    let query = `
      SELECT * FROM coping_strategies 
      WHERE user_id = ? AND is_active = 1
    `;
    const params: any[] = [userId];
    
    if (category) {
      query += ' AND strategy_category = ?';
      params.push(category);
    }
    
    if (mood) {
      query += ' AND (mood_tags LIKE ? OR mood_tags IS NULL)';
      params.push(`%${mood}%`);
    }
    
    if (stressLevel) {
      const stress = parseInt(String(stressLevel));
      query += ' AND (stress_levels LIKE ? OR stress_levels IS NULL)';
      params.push(`%${stress}%`);
    }
    
    query += ' ORDER BY effectiveness_rating DESC, usage_count DESC LIMIT ?';
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coping strategies:', error);
    res.status(500).json({ error: 'Failed to fetch coping strategies' });
  }
});

// GET /api/coping-strategies/categories - Get strategy categories
router.get('/categories', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    
    const result = await pool.query(`
      SELECT strategy_category, COUNT(*) as count
      FROM coping_strategies 
      WHERE user_id = ? AND is_active = 1
      GROUP BY strategy_category
      ORDER BY count DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching strategy categories:', error);
    res.status(500).json({ error: 'Failed to fetch strategy categories' });
  }
});

// GET /api/coping-strategies/recommended - Get AI-recommended strategies
router.get('/recommended', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const mood = req.query.mood;
    const stressLevel = req.query.stress_level;
    const triggers = req.query.triggers;
    
    // Get recent mood data for context
    const recentMood = await pool.query(`
      SELECT mood_score, stress_level, mood_tags, triggers
      FROM mood_tracking 
      WHERE user_id = ? 
      ORDER BY mood_date DESC 
      LIMIT 1
    `, [userId]);
    
    let recommendations = [];
    
    if (recentMood.rows.length > 0) {
      const moodData = recentMood.rows[0];
      const currentMood = mood || moodData.mood_score;
      const currentStress = stressLevel || moodData.stress_level;
      const currentTriggers = triggers || moodData.triggers;
      
      // Find strategies that match current mood/stress/triggers
      let query = `
        SELECT * FROM coping_strategies 
        WHERE user_id = ? AND is_active = 1
      `;
      const params: any[] = [userId];
      
      // Match by stress level
      if (currentStress) {
        query += ' AND (stress_levels LIKE ? OR stress_levels IS NULL)';
        params.push(`%${currentStress}%`);
      }
      
      // Match by mood tags
      if (moodData.mood_tags) {
        const moodTags = moodData.mood_tags.split(',').map((tag: string) => tag.trim());
        const moodConditions = moodTags.map(() => 'mood_tags LIKE ?').join(' OR ');
        query += ` AND (${moodConditions} OR mood_tags IS NULL)`;
        moodTags.forEach((tag: string) => params.push(`%${tag}%`));
      }
      
      // Match by triggers
      if (currentTriggers) {
        const triggerList = currentTriggers.split(',').map((t: string) => t.trim());
        const triggerConditions = triggerList.map(() => 'triggers LIKE ?').join(' OR ');
        query += ` AND (${triggerConditions} OR triggers IS NULL)`;
        triggerList.forEach((trigger: string) => params.push(`%${trigger}%`));
      }
      
      query += ' ORDER BY effectiveness_rating DESC, usage_count DESC LIMIT 5';
      
      const result = await pool.query(query, params);
      recommendations = result.rows;
    } else {
      // Fallback to most effective strategies
      const result = await pool.query(`
        SELECT * FROM coping_strategies 
        WHERE user_id = ? AND is_active = 1
        ORDER BY effectiveness_rating DESC, usage_count DESC
        LIMIT 5
      `, [userId]);
      recommendations = result.rows;
    }
    
    res.json({
      recommendations,
      context: {
        mood: recentMood.rows[0]?.mood_score,
        stress: recentMood.rows[0]?.stress_level,
        triggers: recentMood.rows[0]?.triggers
      }
    });
  } catch (error) {
    console.error('Error fetching recommended strategies:', error);
    res.status(500).json({ error: 'Failed to fetch recommended strategies' });
  }
});

// POST /api/coping-strategies - Create new coping strategy
router.post('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = CopingStrategySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const {
      strategy_name,
      strategy_category,
      description,
      instructions,
      duration_minutes,
      difficulty_level,
      mood_tags,
      stress_levels,
      triggers
    } = validation.data;
    
    const strategyId = uuidv4();
    
    await pool.query(`
      INSERT INTO coping_strategies (
        id, user_id, strategy_name, strategy_category, description, instructions,
        duration_minutes, difficulty_level, mood_tags, stress_levels, triggers,
        is_personalized, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `, [
      strategyId,
      userId,
      strategy_name,
      strategy_category,
      description,
      instructions,
      duration_minutes || null,
      difficulty_level || 1,
      mood_tags || null,
      stress_levels || null,
      triggers || null
    ]);
    
    res.status(201).json({
      id: strategyId,
      message: 'Coping strategy created successfully'
    });
  } catch (error) {
    console.error('Error creating coping strategy:', error);
    res.status(500).json({ error: 'Failed to create coping strategy' });
  }
});

// POST /api/coping-strategies/use - Record strategy usage
router.post('/use', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = StrategyUsageSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const {
      strategy_id,
      mood_before,
      mood_after,
      stress_before,
      stress_after,
      effectiveness_rating,
      notes,
      context
    } = validation.data;
    
    const usageId = uuidv4();
    const usedAt = new Date().toISOString();
    
    // Record usage
    await pool.query(`
      INSERT INTO coping_strategy_usage (
        id, user_id, strategy_id, used_at, mood_before, mood_after,
        stress_before, stress_after, effectiveness_rating, notes, context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      usageId,
      userId,
      strategy_id,
      usedAt,
      mood_before || null,
      mood_after || null,
      stress_before || null,
      stress_after || null,
      effectiveness_rating || null,
      notes || null,
      context || null
    ]);
    
    // Update strategy usage count and effectiveness
    if (effectiveness_rating) {
      await pool.query(`
        UPDATE coping_strategies 
        SET usage_count = usage_count + 1,
            last_used = ?,
            effectiveness_rating = (
              SELECT AVG(effectiveness_rating) 
              FROM coping_strategy_usage 
              WHERE strategy_id = ? AND effectiveness_rating IS NOT NULL
            )
        WHERE id = ?
      `, [usedAt, strategy_id, strategy_id]);
    } else {
      await pool.query(`
        UPDATE coping_strategies 
        SET usage_count = usage_count + 1,
            last_used = ?
        WHERE id = ?
      `, [usedAt, strategy_id]);
    }
    
    res.json({
      id: usageId,
      message: 'Strategy usage recorded successfully'
    });
  } catch (error) {
    console.error('Error recording strategy usage:', error);
    res.status(500).json({ error: 'Failed to record strategy usage' });
  }
});

// GET /api/coping-strategies/usage - Get usage history
router.get('/usage', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const strategyId = req.query.strategy_id;
    const limit = parseInt(String(req.query.limit || '20')) || 20;
    
    let query = `
      SELECT csu.*, cs.strategy_name, cs.strategy_category
      FROM coping_strategy_usage csu
      JOIN coping_strategies cs ON csu.strategy_id = cs.id
      WHERE csu.user_id = ?
    `;
    const params: any[] = [userId];
    
    if (strategyId) {
      query += ' AND csu.strategy_id = ?';
      params.push(strategyId);
    }
    
    query += ' ORDER BY csu.used_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

// GET /api/coping-strategies/analytics - Get strategy effectiveness analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    
    // Get strategy effectiveness summary
    const effectiveness = await pool.query(`
      SELECT 
        cs.strategy_name,
        cs.strategy_category,
        COUNT(csu.id) as usage_count,
        AVG(csu.effectiveness_rating) as avg_effectiveness,
        AVG(csu.mood_after - csu.mood_before) as avg_mood_improvement,
        AVG(csu.stress_before - csu.stress_after) as avg_stress_reduction,
        MAX(csu.used_at) as last_used
      FROM coping_strategies cs
      LEFT JOIN coping_strategy_usage csu ON cs.id = csu.strategy_id
      WHERE cs.user_id = ? 
        AND csu.used_at >= datetime('now', '-${days} days')
      GROUP BY cs.id, cs.strategy_name, cs.strategy_category
      ORDER BY avg_effectiveness DESC, usage_count DESC
    `, [userId]);
    
    // Get category effectiveness
    const categoryStats = await pool.query(`
      SELECT 
        cs.strategy_category,
        COUNT(csu.id) as total_usage,
        AVG(csu.effectiveness_rating) as avg_effectiveness,
        COUNT(DISTINCT cs.id) as strategy_count
      FROM coping_strategies cs
      LEFT JOIN coping_strategy_usage csu ON cs.id = csu.strategy_id
      WHERE cs.user_id = ? 
        AND csu.used_at >= datetime('now', '-${days} days')
      GROUP BY cs.strategy_category
      ORDER BY avg_effectiveness DESC
    `, [userId]);
    
    res.json({
      strategy_effectiveness: effectiveness.rows,
      category_stats: categoryStats.rows,
      period_days: days
    });
  } catch (error) {
    console.error('Error fetching strategy analytics:', error);
    res.status(500).json({ error: 'Failed to fetch strategy analytics' });
  }
});

export default router;
