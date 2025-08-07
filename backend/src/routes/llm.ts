import express from 'express';
import llmService from '../services/llm';

const router = express.Router();

// POST /api/llm/enhance-note - Enhance a note with LLM
router.post('/enhance-note', async (req, res) => {
  try {
    const { content, projectContext } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await llmService.enhanceNote({ content, projectContext });
    res.json(result);
  } catch (error) {
    console.error('Error enhancing note:', error);
    res.status(500).json({ error: 'Failed to enhance note' });
  }
});

// POST /api/llm/generate-todos - Generate todos for a project
router.post('/generate-todos', async (req, res) => {
  try {
    const { projectName, projectDescription, recentNotes } = req.body;
    
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const result = await llmService.generateTodos({
      projectName,
      projectDescription,
      recentNotes
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error generating todos:', error);
    res.status(500).json({ error: 'Failed to generate todos' });
  }
});

// POST /api/llm/generate-report - Generate a report
router.post('/generate-report', async (req, res) => {
  try {
    const { projectName, notes, todos, reportType, recipient } = req.body;
    
    if (!projectName || !reportType) {
      return res.status(400).json({ error: 'Project name and report type are required' });
    }
    
    const result = await llmService.generateReport({
      projectName,
      notes: notes || [],
      todos: todos || [],
      reportType,
      recipient
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
