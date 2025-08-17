import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import llmService from '../services/llm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Validation schemas
const createNoteSchema = z.object({
  project_id: z.string().uuid(),
  content: z.string().min(1),
});

const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
});

// Helper to extract a JSON object from an LLM text response that may include
// code fences or surrounding prose
function extractJsonObject(text: string): any | null {
  if (!text) return null;
  // 1) Try direct parse
  try { return JSON.parse(text); } catch {}
  // 2) Try ```json ... ``` or ``` ... ``` fenced blocks
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    const candidate = fenceMatch[1].trim();
    try { return JSON.parse(candidate); } catch {}
  }
  // 3) Try first balanced braces slice
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  return null;
}

function parseStructured(row: any) {
  if (!row) return row;
  if (row.structured_data && typeof row.structured_data === 'string') {
    try {
      row.structured_data = JSON.parse(row.structured_data);
    } catch {
      // leave as-is if it fails
    }
  }
  return row;
}

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
    
    res.json(result.rows.map(parseStructured));
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
    
    res.json(parseStructured(result.rows[0]));
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
      const parsedData = extractJsonObject(String(llmResult.data || ''));
      if (parsedData) {
        enhancedContent = parsedData.enhanced_content || null;
        try { structuredData = JSON.stringify(parsedData); } catch {}
      } else {
        console.error('Error parsing LLM response: unable to extract JSON');
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
    
    res.status(201).json(parseStructured(result.rows[0]));
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
      const parsedData = extractJsonObject(String(llmResult.data || ''));
      if (parsedData) {
        enhancedContent = parsedData.enhanced_content || null;
        try { structuredData = JSON.stringify(parsedData); } catch {}
      } else {
        console.error('Error parsing LLM response: unable to extract JSON');
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
    
    res.json(parseStructured(result.rows[0]));
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

// POST /api/notes/transcribe - Transcribe audio to text via OpenAI Whisper
// Uses multipart/form-data with field name "audio"
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Speech service not configured (missing OPENAI_API_KEY)' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No audio uploaded' });
    }

    const contentType = req.file.mimetype || 'application/octet-stream';
    const filename = req.file.originalname || `audio-${Date.now()}`;

    const form = new FormData();
    form.append('file', req.file.buffer, { filename, contentType });
    form.append('model', process.env.OPENAI_STT_MODEL || 'whisper-1');
    // Optional: language, response_format, temperature
    if (process.env.OPENAI_STT_LANGUAGE) form.append('language', process.env.OPENAI_STT_LANGUAGE);
    form.append('response_format', 'json');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders()
        },
        timeout: 120000
      }
    );

    // OpenAI Whisper returns { text: string, ... }
    const transcript = response?.data?.text || '';

    return res.json({ success: true, transcript });
  } catch (error: any) {
    console.error('Transcription error:', error?.response?.data || error?.message || error);
    return res.status(500).json({ success: false, error: 'Failed to transcribe audio' });
  }
});
