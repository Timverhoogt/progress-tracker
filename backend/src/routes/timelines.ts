import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import llmService from '../services/llm';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const upsertMilestoneSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  target_date: z.string().optional(),
  status: z.enum(['planned','in_progress','completed','cancelled']).optional(),
});

// GET /api/timelines?project_id=uuid -> fetch dated todos + milestones ordered by date
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query as { project_id?: string };
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    const todosResult = await pool.query(
      `SELECT id, title, description, status, due_date
       FROM todos
       WHERE project_id = ? AND due_date IS NOT NULL AND due_date != ''
       ORDER BY due_date ASC`,
      [project_id]
    );

    const milestonesResult = await pool.query(
      `SELECT id, title, description, status, target_date
       FROM milestones
       WHERE project_id = ?
       ORDER BY target_date ASC`,
      [project_id]
    );

    res.json({
      todos: todosResult.rows,
      milestones: milestonesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// POST /api/timelines/milestones -> create milestone
router.post('/milestones', async (req, res) => {
  try {
    const data = upsertMilestoneSchema.parse(req.body);
    const id = uuidv4();
    await pool.query(
      `INSERT INTO milestones (id, project_id, title, description, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.project_id, data.title, data.description, data.target_date, data.status || 'planned']
    );
    const result = await pool.query('SELECT * FROM milestones WHERE id = ?', [id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// PUT /api/timelines/milestones/:id -> update milestone
router.put('/milestones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = upsertMilestoneSchema.partial().parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = datetime('now')`);
    values.push(id);

    const result = await pool.query(`UPDATE milestones SET ${updates.join(', ')} WHERE id = ?`, values);
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Milestone not found' });
    const fetch = await pool.query('SELECT * FROM milestones WHERE id = ?', [id]);
    res.json(fetch.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// DELETE /api/timelines/milestones/:id -> delete milestone
router.delete('/milestones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM milestones WHERE id = ?', [id]);
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Milestone not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

// POST /api/timelines/estimate -> LLM suggest dates/milestones
router.post('/estimate', async (req, res) => {
  try {
    const schema = z.object({ project_id: z.string().uuid() });
    const { project_id } = schema.parse(req.body);

    const projectRes = await pool.query('SELECT name, description FROM projects WHERE id = ?', [project_id]);
    if (!projectRes.rows.length) return res.status(404).json({ error: 'Project not found' });
    const project = projectRes.rows[0];

    const todosRes = await pool.query(
      `SELECT title, due_date, status FROM todos WHERE project_id = ? AND (due_date IS NOT NULL AND due_date != '') ORDER BY due_date ASC`,
      [project_id]
    );
    const milestonesRes = await pool.query(
      `SELECT title, target_date, status FROM milestones WHERE project_id = ? ORDER BY target_date ASC`,
      [project_id]
    );

    const llm = await llmService.estimateTimeline({
      projectName: project.name,
      projectDescription: project.description,
      datedTodos: todosRes.rows,
      milestones: milestonesRes.rows,
    });

    if (!llm.success) return res.status(500).json({ error: 'Failed to estimate timeline', details: llm.error });

    res.json({ success: true, data: llm.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error estimating timeline:', error);
    res.status(500).json({ error: 'Failed to estimate timeline' });
  }
});

export default router;


