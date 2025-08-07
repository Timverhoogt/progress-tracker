import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import llmService from '../services/llm';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schemas
const createTodoSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional(),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional(),
});

// GET /api/todos?project_id=uuid - Get todos for a project
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM todos WHERE project_id = ? ORDER BY created_at DESC',
      [project_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /api/todos - Create new todo
router.post('/', async (req, res) => {
  try {
    const validatedData = createTodoSchema.parse(req.body);
    const todoId = uuidv4();
    
    await pool.query(
      'INSERT INTO todos (id, project_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        todoId,
        validatedData.project_id,
        validatedData.title,
        validatedData.description,
        validatedData.priority || 'medium',
        validatedData.due_date
      ]
    );
    
    // Fetch the created todo
    const result = await pool.query('SELECT * FROM todos WHERE id = ?', [todoId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// POST /api/todos/generate - Generate AI-suggested todos
router.post('/generate', async (req, res) => {
  try {
    const { project_id } = req.body;
    
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    
    // Get project info and recent notes
    const projectResult = await pool.query(
      'SELECT name, description FROM projects WHERE id = ?',
      [project_id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    // Get recent notes for context
    const notesResult = await pool.query(
      'SELECT content FROM notes WHERE project_id = ? ORDER BY created_at DESC LIMIT 5',
      [project_id]
    );
    
    const recentNotes = notesResult.rows.map(note => note.content);
    
    // Generate todos with LLM
    const llmResult = await llmService.generateTodos({
      projectName: project.name,
      projectDescription: project.description,
      recentNotes
    });
    
    if (!llmResult.success) {
      console.error('LLM Service Error:', llmResult.error);
      return res.status(500).json({ error: 'Failed to generate todos', details: llmResult.error });
    }
    
    console.log('LLM Raw Response:', llmResult.data);
    
    let generatedTodos = [];
    try {
      generatedTodos = JSON.parse(llmResult.data);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('LLM Response that failed to parse:', llmResult.data);
      return res.status(500).json({ error: 'Failed to parse generated todos', raw_response: llmResult.data });
    }
    
    // Insert generated todos into database
    const insertedTodos = [];
    for (const todo of generatedTodos) {
      const todoId = uuidv4();
      await pool.query(
        'INSERT INTO todos (id, project_id, title, description, priority, llm_generated) VALUES (?, ?, ?, ?, ?, ?)',
        [todoId, project_id, todo.title, todo.description, todo.priority || 'medium', 1] // 1 for true in SQLite
      );
      
      // Fetch the created todo
      const result = await pool.query('SELECT * FROM todos WHERE id = ?', [todoId]);
      insertedTodos.push(result.rows[0]);
    }
    
    res.json(insertedTodos);
  } catch (error) {
    console.error('Error generating todos:', error);
    res.status(500).json({ error: 'Failed to generate todos' });
  }
});

// PUT /api/todos/:id - Update todo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTodoSchema.parse(req.body);
    
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
      `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Fetch the updated todo
    const result = await pool.query('SELECT * FROM todos WHERE id = ?', [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = ?', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
