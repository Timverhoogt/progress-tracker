import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const ReflectionTemplateSchema = z.object({
  template_name: z.string().min(1),
  template_type: z.enum(['daily', 'weekly', 'monthly', 'project', 'skills', 'custom']),
  frequency: z.string().default('weekly'),
  prompt_questions: z.string().min(1), // JSON string of questions array
  is_active: z.boolean().default(true)
});

const ReflectionResponseSchema = z.object({
  template_id: z.string().min(1),
  reflection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  responses: z.string().min(1), // JSON string of responses
  mood_at_reflection: z.number().int().min(1).max(10).optional(),
  time_spent_minutes: z.number().int().positive().optional()
});

const UpdateTemplateSchema = z.object({
  template_name: z.string().min(1).optional(),
  frequency: z.string().optional(),
  prompt_questions: z.string().optional(),
  is_active: z.boolean().optional()
});

// Template Routes

// GET /api/reflections/templates - Get reflection templates
router.get('/templates', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const type = req.query.type;
    const activeOnly = req.query.active === 'true';
    
    let query = 'SELECT * FROM reflection_templates WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (type) {
      query += ' AND template_type = ?';
      params.push(type);
    }
    
    if (activeOnly) {
      query += ' AND is_active = 1';
    }
    
    query += ' ORDER BY is_default DESC, template_name';
    
    const result = await db.query(query, params);
    
    // Parse prompt_questions JSON for each template
    const templates = result.rows.map(template => ({
      ...template,
      prompt_questions: JSON.parse(template.prompt_questions)
    }));
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching reflection templates:', error);
    res.status(500).json({ error: 'Failed to fetch reflection templates' });
  }
});

// GET /api/reflections/templates/:id - Get specific template
router.get('/templates/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM reflection_templates WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reflection template not found' });
    }
    
    const template = result.rows[0];
    template.prompt_questions = JSON.parse(template.prompt_questions);
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching reflection template:', error);
    res.status(500).json({ error: 'Failed to fetch reflection template' });
  }
});

// POST /api/reflections/templates - Create reflection template
router.post('/templates', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = ReflectionTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      template_name, 
      template_type, 
      frequency, 
      prompt_questions, 
      is_active 
    } = validation.data;
    
    // Validate that prompt_questions is valid JSON
    try {
      JSON.parse(prompt_questions);
    } catch (e) {
      return res.status(400).json({ error: 'prompt_questions must be valid JSON' });
    }
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO reflection_templates (
        id, user_id, template_name, template_type, frequency, prompt_questions, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, template_name, template_type, frequency, prompt_questions, is_active ? 1 : 0]);
    
    const result = await db.query(
      'SELECT * FROM reflection_templates WHERE id = ?',
      [id]
    );
    
    const template = result.rows[0];
    template.prompt_questions = JSON.parse(template.prompt_questions);
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating reflection template:', error);
    res.status(500).json({ error: 'Failed to create reflection template' });
  }
});

// PUT /api/reflections/templates/:id - Update reflection template
router.put('/templates/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const validation = UpdateTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const updateData = validation.data;
    
    // Validate prompt_questions if provided
    if (updateData.prompt_questions) {
      try {
        JSON.parse(updateData.prompt_questions);
      } catch (e) {
        return res.status(400).json({ error: 'prompt_questions must be valid JSON' });
      }
    }
    
    const updateFields = [];
    const updateValues = [];
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateFields.push('updated_at = datetime(\'now\')');
    updateValues.push(id, userId);
    
    const result = await db.query(`
      UPDATE reflection_templates 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Reflection template not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM reflection_templates WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    const template = updated.rows[0];
    template.prompt_questions = JSON.parse(template.prompt_questions);
    
    res.json(template);
  } catch (error) {
    console.error('Error updating reflection template:', error);
    res.status(500).json({ error: 'Failed to update reflection template' });
  }
});

// DELETE /api/reflections/templates/:id - Delete reflection template
router.delete('/templates/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    // Check if template is default
    const template = await db.query(
      'SELECT is_default FROM reflection_templates WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (template.rows.length === 0) {
      return res.status(404).json({ error: 'Reflection template not found' });
    }
    
    if (template.rows[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete default templates' });
    }
    
    const result = await db.query(
      'DELETE FROM reflection_templates WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting reflection template:', error);
    res.status(500).json({ error: 'Failed to delete reflection template' });
  }
});

// Response Routes

// GET /api/reflections/responses - Get reflection responses
router.get('/responses', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const templateId = req.query.template_id;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const limit = parseInt(String(req.query.limit || '50')) || 50;
    
    let query = `
      SELECT r.*, t.template_name, t.template_type 
      FROM reflection_responses r
      JOIN reflection_templates t ON r.template_id = t.id
      WHERE r.user_id = ?
    `;
    let params: any[] = [userId];
    
    if (templateId) {
      query += ' AND r.template_id = ?';
      params.push(templateId);
    }
    
    if (startDate && endDate) {
      query += ' AND r.reflection_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND r.reflection_date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND r.reflection_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY r.reflection_date DESC LIMIT ?';
    params.push(limit);
    
    const result = await db.query(query, params);
    
    // Parse JSON fields
    const responses = result.rows.map(response => ({
      ...response,
      responses: JSON.parse(response.responses),
      insights_extracted: response.insights_extracted ? JSON.parse(response.insights_extracted) : null,
      action_items_generated: response.action_items_generated ? JSON.parse(response.action_items_generated) : null
    }));
    
    res.json(responses);
  } catch (error) {
    console.error('Error fetching reflection responses:', error);
    res.status(500).json({ error: 'Failed to fetch reflection responses' });
  }
});

// GET /api/reflections/responses/stats - Get reflection statistics
router.get('/responses/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_reflections,
        COUNT(DISTINCT template_id) as unique_templates_used,
        AVG(mood_at_reflection) as avg_mood_during_reflection,
        AVG(time_spent_minutes) as avg_time_spent,
        t.template_type,
        COUNT(*) as type_count
      FROM reflection_responses r
      JOIN reflection_templates t ON r.template_id = t.id
      WHERE r.user_id = ? AND r.reflection_date >= ?
      GROUP BY t.template_type
      ORDER BY type_count DESC
    `, [userId, startDateStr]);
    
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_reflections,
        AVG(mood_at_reflection) as overall_avg_mood,
        SUM(time_spent_minutes) as total_time_spent
      FROM reflection_responses 
      WHERE user_id = ? AND reflection_date >= ?
    `, [userId, startDateStr]);
    
    res.json({
      summary: summary.rows[0],
      by_type: result.rows,
      period_days: days
    });
  } catch (error) {
    console.error('Error fetching reflection stats:', error);
    res.status(500).json({ error: 'Failed to fetch reflection statistics' });
  }
});

// POST /api/reflections/responses - Create reflection response
router.post('/responses', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = ReflectionResponseSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      template_id, 
      reflection_date, 
      responses, 
      mood_at_reflection, 
      time_spent_minutes 
    } = validation.data;
    
    // Validate that responses is valid JSON
    try {
      JSON.parse(responses);
    } catch (e) {
      return res.status(400).json({ error: 'responses must be valid JSON' });
    }
    
    // Verify template exists and belongs to user
    const template = await db.query(
      'SELECT id FROM reflection_templates WHERE id = ? AND user_id = ?',
      [template_id, userId]
    );
    
    if (template.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid template_id' });
    }
    
    const id = uuidv4();
    
    // Here you could call AI service to extract insights and action items
    // For now, we'll create placeholder values
    const insights_extracted = JSON.stringify([]);
    const action_items_generated = JSON.stringify([]);
    const ai_analysis = '';
    
    await db.query(`
      INSERT INTO reflection_responses (
        id, user_id, template_id, reflection_date, responses, mood_at_reflection,
        insights_extracted, action_items_generated, ai_analysis, time_spent_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, template_id, reflection_date, responses, mood_at_reflection, insights_extracted, action_items_generated, ai_analysis, time_spent_minutes]);
    
    // Update template usage count
    await db.query(`
      UPDATE reflection_templates 
      SET usage_count = usage_count + 1, last_used_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `, [template_id, userId]);
    
    const result = await db.query(`
      SELECT r.*, t.template_name, t.template_type 
      FROM reflection_responses r
      JOIN reflection_templates t ON r.template_id = t.id
      WHERE r.id = ?
    `, [id]);
    
    const response = result.rows[0];
    response.responses = JSON.parse(response.responses);
    response.insights_extracted = JSON.parse(response.insights_extracted);
    response.action_items_generated = JSON.parse(response.action_items_generated);
    
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Reflection already exists for this template and date' });
    }
    console.error('Error creating reflection response:', error);
    res.status(500).json({ error: 'Failed to create reflection response' });
  }
});

// GET /api/reflections/insights - Get AI-generated insights from reflections
router.get('/insights', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get recent reflections with AI analysis
    const reflections = await db.query(`
      SELECT r.*, t.template_type, t.template_name
      FROM reflection_responses r
      JOIN reflection_templates t ON r.template_id = t.id
      WHERE r.user_id = ? AND r.reflection_date >= ?
      ORDER BY r.reflection_date DESC
    `, [userId, startDateStr]);
    
    // Aggregate insights across reflections
    const insights = {
      patterns: [] as any[],
      growth_areas: [] as any[],
      recurring_themes: [] as any[],
      action_trends: [] as any[]
    };
    
    for (const reflection of reflections.rows) {
      if (reflection.insights_extracted) {
        try {
          const extractedInsights = JSON.parse(reflection.insights_extracted);
          insights.patterns.push(...(extractedInsights.patterns || []));
          insights.growth_areas.push(...(extractedInsights.growth_areas || []));
          insights.recurring_themes.push(...(extractedInsights.themes || []));
        } catch (e) {
          // Skip invalid JSON
        }
      }
      
      if (reflection.action_items_generated) {
        try {
          const actionItems = JSON.parse(reflection.action_items_generated);
          insights.action_trends.push(...actionItems);
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    // Calculate reflection frequency and mood trends
    const moodTrends = reflections.rows
      .filter(r => r.mood_at_reflection)
      .map(r => ({
        date: r.reflection_date,
        mood: r.mood_at_reflection,
        template_type: r.template_type
      }));
    
    res.json({
      insights,
      mood_trends: moodTrends,
      reflection_frequency: reflections.rows.length,
      period_days: days
    });
  } catch (error) {
    console.error('Error generating reflection insights:', error);
    res.status(500).json({ error: 'Failed to generate reflection insights' });
  }
});

// GET /api/reflections/prompts - Get suggested reflection prompts based on context
router.get('/prompts', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const context = req.query.context || 'general'; // general, project, skills, mood
    
    // Get user's recent activity for contextual prompts
    const recentNotes = await db.query(`
      SELECT content, created_at FROM notes 
      ORDER BY created_at DESC LIMIT 5
    `);
    
    const recentMood = await db.query(`
      SELECT mood_score, stress_level FROM mood_tracking 
      WHERE user_id = ? 
      ORDER BY mood_date DESC LIMIT 3
    `, [userId]);
    
    // Generate contextual prompts based on recent activity
    const prompts = [];
    
    if (context === 'mood' || context === 'general') {
      if (recentMood.rows.length > 0) {
        const avgMood = recentMood.rows.reduce((sum, m) => sum + m.mood_score, 0) / recentMood.rows.length;
        if (avgMood < 6) {
          prompts.push({
            type: 'wellbeing',
            prompt: 'I notice your mood has been lower recently. What factors might be contributing to this, and what support do you need?',
            priority: 'high'
          });
        }
        
        const avgStress = recentMood.rows.reduce((sum, m) => sum + (m.stress_level || 0), 0) / recentMood.rows.length;
        if (avgStress > 7) {
          prompts.push({
            type: 'stress',
            prompt: 'Your stress levels seem elevated lately. What strategies have helped you manage stress in the past, and which ones could you apply now?',
            priority: 'high'
          });
        }
      }
    }
    
    if (context === 'project' || context === 'general') {
      prompts.push({
        type: 'progress',
        prompt: 'What progress have you made on your key projects this week? What obstacles did you overcome, and what did you learn?',
        priority: 'medium'
      });
    }
    
    if (context === 'skills' || context === 'general') {
      prompts.push({
        type: 'growth',
        prompt: 'What new skills or knowledge have you gained recently? How can you apply these learnings to your current challenges?',
        priority: 'medium'
      });
    }
    
    // Add some general reflection prompts
    prompts.push(
      {
        type: 'gratitude',
        prompt: 'What are three things you accomplished this week that you\'re proud of?',
        priority: 'low'
      },
      {
        type: 'future',
        prompt: 'Looking ahead to next week, what are your top priorities and how will you approach them?',
        priority: 'medium'
      }
    );
    
    res.json(prompts);
  } catch (error) {
    console.error('Error generating reflection prompts:', error);
    res.status(500).json({ error: 'Failed to generate reflection prompts' });
  }
});

export default router;
