import express from 'express';
import { pool } from '../server';
import { z } from 'zod';
import llmService from '../services/llm';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schema
const generateReportSchema = z.object({
  project_id: z.string().uuid(),
  report_type: z.enum(['status', 'summary', 'stakeholder']),
  recipient: z.string().optional(),
});

// GET /api/reports?project_id=uuid - Get reports for a project
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC',
      [project_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports/generate - Generate a new report
router.post('/generate', async (req, res) => {
  try {
    const validatedData = generateReportSchema.parse(req.body);
    
    // Get project info
    const projectResult = await pool.query(
      'SELECT name, description FROM projects WHERE id = ?',
      [validatedData.project_id]
    );
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    // Get notes for the project
    const notesResult = await pool.query(
      'SELECT content, enhanced_content FROM notes WHERE project_id = ? ORDER BY created_at DESC',
      [validatedData.project_id]
    );
    
    const notes = notesResult.rows.map(note => 
      note.enhanced_content || note.content
    );
    
    // Get todos for the project
    const todosResult = await pool.query(
      'SELECT title, description, status, priority FROM todos WHERE project_id = ? ORDER BY created_at DESC',
      [validatedData.project_id]
    );
    
    const todos = todosResult.rows.map(todo => 
      `${todo.title} (${todo.status}, ${todo.priority} priority)${todo.description ? ': ' + todo.description : ''}`
    );
    
    // Generate report with LLM
    const llmResult = await llmService.generateReport({
      projectName: project.name,
      notes,
      todos,
      reportType: validatedData.report_type,
      recipient: validatedData.recipient
    });
    
    if (!llmResult.success) {
      return res.status(500).json({ error: 'Failed to generate report', details: llmResult.error });
    }
    
    // Save report to database
    const reportTitle = `${validatedData.report_type.charAt(0).toUpperCase() + validatedData.report_type.slice(1)} Report - ${project.name}`;
    const reportId = uuidv4();
    
    await pool.query(
      'INSERT INTO reports (id, project_id, title, content, report_type, recipient) VALUES (?, ?, ?, ?, ?, ?)',
      [
        reportId,
        validatedData.project_id,
        reportTitle,
        llmResult.data,
        validatedData.report_type,
        validatedData.recipient
      ]
    );
    
    // Fetch the created report
    const result = await pool.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/:id - Get single report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// DELETE /api/reports/:id - Delete report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
