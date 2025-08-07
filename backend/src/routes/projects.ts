import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']).optional(),
});

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects ORDER BY updated_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const projectId = uuidv4();
    
    await pool.query(
      'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
      [projectId, validatedData.name, validatedData.description]
    );
    
    // Fetch the created project
    const result = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);
    
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = datetime('now')`);
    values.push(id);
    
    const updateResult = await pool.query(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Fetch the updated project
    const result = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
