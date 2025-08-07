import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import llmService from '../services/llm';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schemas
const createNoteSchema = z.object({
  project_id: z.string().uuid(),
  content: z.string().min(1),
});

const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
});

// GET /api/notes?project_id=uuid - Get notes for a project
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM notes WHERE project_id = ? ORDER BY created_at DESC',
      [project_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes - Create new note (with LLM enhancement)
router.post('/', async (req, res) => {
  try {
    const validatedData = createNoteSchema.parse(req.body);
    
    // Get project context for LLM enhancement
    const projectResult = await pool.query(
      'SELECT name, description FROM projects WHERE id = ?',
      [validatedData.project_id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    const projectContext = `${project.name}: ${project.description || ''}`;
    
    // Enhance note with LLM
    const llmResult = await llmService.enhanceNote({
      content: validatedData.content,
      projectContext
    });
    
    let enhancedContent = null;
    let structuredData = null;
    
    if (llmResult.success) {
      try {
        const parsedData = JSON.parse(llmResult.data);
        enhancedContent = parsedData.enhanced_content;
        structuredData = JSON.stringify(parsedData); // Store as JSON string in SQLite
      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError);
        // Continue without enhancement if parsing fails
      }
    }
    
    // Save note to database
    const noteId = uuidv4();
    await pool.query(
      'INSERT INTO notes (id, project_id, content, enhanced_content, structured_data) VALUES (?, ?, ?, ?, ?)',
      [noteId, validatedData.project_id, validatedData.content, enhancedContent, structuredData]
    );
    
    // Fetch the created note
    const result = await pool.query('SELECT * FROM notes WHERE id = ?', [noteId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateNoteSchema.parse(req.body);
    
    if (!validatedData.content) {
      return res.status(400).json({ error: 'No content to update' });
    }
    
    // Get note and project context for re-enhancement
    const noteResult = await pool.query(
      'SELECT n.*, p.name, p.description FROM notes n JOIN projects p ON n.project_id = p.id WHERE n.id = ?',
      [id]
    );
    
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = noteResult.rows[0];
    const projectContext = `${note.name}: ${note.description || ''}`;
    
    // Re-enhance note with LLM
    const llmResult = await llmService.enhanceNote({
      content: validatedData.content,
      projectContext
    });
    
    let enhancedContent = null;
    let structuredData = null;
    
    if (llmResult.success) {
      try {
        const parsedData = JSON.parse(llmResult.data);
        enhancedContent = parsedData.enhanced_content;
        structuredData = JSON.stringify(parsedData); // Store as JSON string in SQLite
      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError);
      }
    }
    
    // Update note
    const updateResult = await pool.query(
      "UPDATE notes SET content = ?, enhanced_content = ?, structured_data = ?, updated_at = datetime('now') WHERE id = ?",
      [validatedData.content, enhancedContent, structuredData, id]
    );
    
    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Fetch the updated note
    const result = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notes WHERE id = ?', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
