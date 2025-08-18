import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const LearningPathSchema = z.object({
  path_name: z.string().min(1),
  path_description: z.string().optional(),
  skill_focus: z.string().min(1),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimated_duration_hours: z.number().int().positive().optional(),
  custom_resources: z.string().optional(),
  completion_criteria: z.string().optional()
});

const UpdateLearningPathSchema = z.object({
  path_name: z.string().min(1).optional(),
  path_description: z.string().optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_duration_hours: z.number().int().positive().optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'paused']).optional(),
  custom_resources: z.string().optional(),
  completion_criteria: z.string().optional()
});

const BestPracticeSchema = z.object({
  practice_title: z.string().min(1),
  practice_description: z.string().min(1),
  practice_category: z.string().min(1),
  situation_context: z.string().optional(),
  lessons_learned: z.string().optional(),
  success_metrics: z.string().optional(),
  related_projects: z.string().optional(),
  tags: z.string().optional(),
  effectiveness_rating: z.number().int().min(1).max(5).optional(),
  source_note_id: z.string().optional()
});

// Learning Paths Routes

// GET /api/learning/paths - Get all learning paths
router.get('/paths', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const status = req.query.status;
    
    let query = 'SELECT * FROM learning_paths WHERE user_id = ?';
    let params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

// GET /api/learning/paths/stats - Get learning path statistics
router.get('/paths/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_paths,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_paths,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_paths,
        AVG(progress_percentage) as avg_progress,
        SUM(estimated_duration_hours) as total_estimated_hours,
        difficulty_level,
        COUNT(*) as difficulty_count
      FROM learning_paths 
      WHERE user_id = ?
      GROUP BY difficulty_level
    `, [userId]);
    
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_paths,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_paths,
        AVG(progress_percentage) as overall_avg_progress
      FROM learning_paths 
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      summary: summary.rows[0],
      by_difficulty: result.rows
    });
  } catch (error) {
    console.error('Error fetching learning path stats:', error);
    res.status(500).json({ error: 'Failed to fetch learning path statistics' });
  }
});

// GET /api/learning/paths/:id - Get specific learning path
router.get('/paths/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM learning_paths WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ error: 'Failed to fetch learning path' });
  }
});

// POST /api/learning/paths - Create new learning path
router.post('/paths', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = LearningPathSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      path_name, 
      path_description, 
      skill_focus, 
      difficulty_level, 
      estimated_duration_hours, 
      custom_resources, 
      completion_criteria 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO learning_paths (
        id, user_id, path_name, path_description, skill_focus, difficulty_level,
        estimated_duration_hours, custom_resources, completion_criteria
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, path_name, path_description, skill_focus, difficulty_level, estimated_duration_hours, custom_resources, completion_criteria]);
    
    const result = await db.query(
      'SELECT * FROM learning_paths WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating learning path:', error);
    res.status(500).json({ error: 'Failed to create learning path' });
  }
});

// PUT /api/learning/paths/:id - Update learning path
router.put('/paths/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const validation = UpdateLearningPathSchema.safeParse(req.body);
    
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
    
    // Check if starting or completing the path
    if (updateData.status === 'in_progress') {
      updateFields.push('started_at = datetime(\'now\')');
    }
    if (updateData.status === 'completed') {
      updateFields.push('completed_at = datetime(\'now\')');
    }
    
    updateValues.push(id, userId);
    
    const result = await db.query(`
      UPDATE learning_paths 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM learning_paths WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating learning path:', error);
    res.status(500).json({ error: 'Failed to update learning path' });
  }
});

// POST /api/learning/paths/:id/progress - Update learning path progress
router.post('/paths/:id/progress', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const { progress_percentage, notes } = req.body;
    
    if (progress_percentage < 0 || progress_percentage > 100) {
      return res.status(400).json({ error: 'Progress percentage must be between 0 and 100' });
    }
    
    let updateFields = ['progress_percentage = ?', 'updated_at = datetime(\'now\')'];
    let updateValues = [progress_percentage];
    
    // Auto-update status based on progress
    if (progress_percentage === 0) {
      updateFields.push('status = ?');
      updateValues.push('not_started');
    } else if (progress_percentage === 100) {
      updateFields.push('status = ?', 'completed_at = datetime(\'now\')');
      updateValues.push('completed');
    } else {
      updateFields.push('status = ?');
      updateValues.push('in_progress');
      // Set started_at if not already set
      updateFields.push(`started_at = COALESCE(started_at, datetime('now'))`);
    }
    
    updateValues.push(id, userId);
    
    const result = await db.query(`
      UPDATE learning_paths 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM learning_paths WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating learning path progress:', error);
    res.status(500).json({ error: 'Failed to update learning path progress' });
  }
});

// DELETE /api/learning/paths/:id - Delete learning path
router.delete('/paths/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM learning_paths WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Learning path not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting learning path:', error);
    res.status(500).json({ error: 'Failed to delete learning path' });
  }
});

// Best Practices Routes

// GET /api/learning/practices - Get best practices
router.get('/practices', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const category = req.query.category;
    const tags = req.query.tags;
    
    let query = 'SELECT * FROM best_practices WHERE user_id = ?';
    let params = [userId];
    
    if (category) {
      query += ' AND practice_category = ?';
      params.push(category);
    }
    
    if (tags) {
      query += ' AND tags LIKE ?';
      params.push(`%${tags}%`);
    }
    
    query += ' ORDER BY effectiveness_rating DESC, usage_count DESC, created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching best practices:', error);
    res.status(500).json({ error: 'Failed to fetch best practices' });
  }
});

// GET /api/learning/practices/categories - Get practice categories
router.get('/practices/categories', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(
      'SELECT DISTINCT practice_category, COUNT(*) as count FROM best_practices WHERE user_id = ? GROUP BY practice_category ORDER BY count DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching practice categories:', error);
    res.status(500).json({ error: 'Failed to fetch practice categories' });
  }
});

// POST /api/learning/practices - Create best practice
router.post('/practices', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = BestPracticeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      practice_title, 
      practice_description, 
      practice_category, 
      situation_context, 
      lessons_learned, 
      success_metrics, 
      related_projects, 
      tags, 
      effectiveness_rating,
      source_note_id 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO best_practices (
        id, user_id, practice_title, practice_description, practice_category,
        situation_context, lessons_learned, success_metrics, related_projects,
        tags, effectiveness_rating, source_note_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, practice_title, practice_description, practice_category, situation_context, lessons_learned, success_metrics, related_projects, tags, effectiveness_rating, source_note_id]);
    
    const result = await db.query(
      'SELECT * FROM best_practices WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating best practice:', error);
    res.status(500).json({ error: 'Failed to create best practice' });
  }
});

// POST /api/learning/practices/:id/use - Record usage of best practice
router.post('/practices/:id/use', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE best_practices 
      SET usage_count = usage_count + 1, last_used_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Best practice not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM best_practices WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error recording practice usage:', error);
    res.status(500).json({ error: 'Failed to record practice usage' });
  }
});

// GET /api/learning/recommendations - Get AI learning recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    
    // Get skill gaps for recommendations
    const skillGaps = await db.query(`
      SELECT *, (target_level - current_level) as gap_size
      FROM skills_assessment 
      WHERE user_id = ? AND current_level < target_level
      ORDER BY gap_size DESC 
      LIMIT 5
    `, [userId]);
    
    // Get current active learning paths
    const activePaths = await db.query(`
      SELECT * FROM learning_paths 
      WHERE user_id = ? AND status = 'in_progress'
    `, [userId]);
    
    // Get relevant best practices
    const relevantPractices = await db.query(`
      SELECT * FROM best_practices 
      WHERE user_id = ? AND effectiveness_rating >= 4
      ORDER BY usage_count DESC, effectiveness_rating DESC
      LIMIT 10
    `, [userId]);
    
    // Generate recommendations based on gaps and progress
    const recommendations = [];
    
    for (const skill of skillGaps.rows) {
      recommendations.push({
        type: 'skill_development',
        priority: skill.gap_size > 2 ? 'high' : 'medium',
        skill_focus: skill.skill_name,
        title: `Develop ${skill.skill_name} skills`,
        description: `Bridge the gap between your current level (${skill.current_level}) and target level (${skill.target_level})`,
        estimated_duration_hours: skill.gap_size * 10, // Rough estimate
        difficulty_level: skill.current_level <= 3 ? 'beginner' : skill.current_level <= 6 ? 'intermediate' : 'advanced'
      });
    }
    
    res.json({
      skill_based_recommendations: recommendations,
      skill_gaps: skillGaps.rows,
      active_learning_paths: activePaths.rows,
      relevant_practices: relevantPractices.rows
    });
  } catch (error) {
    console.error('Error generating learning recommendations:', error);
    res.status(500).json({ error: 'Failed to generate learning recommendations' });
  }
});

export default router;
