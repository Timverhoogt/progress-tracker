import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const SkillSchema = z.object({
  skill_name: z.string().min(1),
  skill_category: z.string().min(1),
  current_level: z.number().int().min(1).max(10).default(1),
  target_level: z.number().int().min(1).max(10).default(5),
  self_assessment_score: z.number().int().min(1).max(10).optional(),
  ai_assessment_score: z.number().int().min(1).max(10).optional(),
  assessment_notes: z.string().optional()
});

const UpdateSkillSchema = z.object({
  current_level: z.number().int().min(1).max(10).optional(),
  target_level: z.number().int().min(1).max(10).optional(),
  self_assessment_score: z.number().int().min(1).max(10).optional(),
  ai_assessment_score: z.number().int().min(1).max(10).optional(),
  assessment_notes: z.string().optional()
});

// GET /api/skills - Get all user skills
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const category = req.query.category;
    
    let query = 'SELECT * FROM skills_assessment WHERE user_id = ?';
    let params = [userId];
    
    if (category) {
      query += ' AND skill_category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY skill_category, skill_name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// GET /api/skills/categories - Get skill categories
router.get('/categories', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(
      'SELECT DISTINCT skill_category FROM skills_assessment WHERE user_id = ? ORDER BY skill_category',
      [userId]
    );
    res.json(result.rows.map(row => row.skill_category));
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    res.status(500).json({ error: 'Failed to fetch skill categories' });
  }
});

// GET /api/skills/progress - Get skills progress summary
router.get('/progress', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(`
      SELECT 
        skill_category,
        COUNT(*) as total_skills,
        AVG(current_level) as avg_current_level,
        AVG(target_level) as avg_target_level,
        AVG(CASE WHEN self_assessment_score IS NOT NULL THEN self_assessment_score END) as avg_self_assessment,
        COUNT(CASE WHEN current_level >= target_level THEN 1 END) as skills_at_target
      FROM skills_assessment 
      WHERE user_id = ?
      GROUP BY skill_category
      ORDER BY skill_category
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills progress:', error);
    res.status(500).json({ error: 'Failed to fetch skills progress' });
  }
});

// GET /api/skills/:id - Get specific skill
router.get('/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM skills_assessment WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

// POST /api/skills - Create new skill assessment
router.post('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = SkillSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      skill_name, 
      skill_category, 
      current_level, 
      target_level, 
      self_assessment_score, 
      ai_assessment_score, 
      assessment_notes 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO skills_assessment (
        id, user_id, skill_name, skill_category, current_level, target_level, 
        self_assessment_score, ai_assessment_score, assessment_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, skill_name, skill_category, current_level, target_level, self_assessment_score, ai_assessment_score, assessment_notes]);
    
    const result = await db.query(
      'SELECT * FROM skills_assessment WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Skill already exists for this category' });
    }
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// PUT /api/skills/:id - Update skill assessment
router.put('/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const validation = UpdateSkillSchema.safeParse(req.body);
    
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
    
    updateFields.push('last_assessed_at = datetime(\'now\')', 'updated_at = datetime(\'now\')');
    updateValues.push(id, userId);
    
    const result = await db.query(`
      UPDATE skills_assessment 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM skills_assessment WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/skills/:id - Delete skill
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM skills_assessment WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// POST /api/skills/bulk-assess - Bulk skill assessment
router.post('/bulk-assess', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { assessments } = req.body;
    
    if (!Array.isArray(assessments)) {
      return res.status(400).json({ error: 'Assessments must be an array' });
    }
    
    await db.transaction(async () => {
      for (const assessment of assessments) {
        const { skill_id, current_level, self_assessment_score, assessment_notes } = assessment;
        
        await db.query(`
          UPDATE skills_assessment 
          SET current_level = ?, self_assessment_score = ?, assessment_notes = ?, 
              last_assessed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ? AND user_id = ?
        `, [current_level, self_assessment_score, assessment_notes, skill_id, userId]);
      }
    });
    
    res.json({ success: true, message: 'Skills assessed successfully' });
  } catch (error) {
    console.error('Error bulk assessing skills:', error);
    res.status(500).json({ error: 'Failed to assess skills' });
  }
});

// GET /api/skills/gaps - Get skill gaps (current < target)
router.get('/gaps', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await db.query(`
      SELECT *, (target_level - current_level) as gap_size
      FROM skills_assessment 
      WHERE user_id = ? AND current_level < target_level
      ORDER BY gap_size DESC, skill_category, skill_name
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skill gaps:', error);
    res.status(500).json({ error: 'Failed to fetch skill gaps' });
  }
});

export default router;
