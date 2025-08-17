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

// GET /api/llm/generated-prompt - Get the generated system prompt text
router.get('/generated-prompt', async (req, res) => {
  try {
    const generatedPrompt = llmService.getGeneratedSystemPrompt();
    res.json({ success: true, data: generatedPrompt });
  } catch (error) {
    console.error('Error getting generated prompt:', error);
    res.status(500).json({ error: 'Failed to get generated prompt' });
  }
});

// POST /api/llm/coaching - AI coaching conversation
router.post('/coaching', async (req, res) => {
  try {
    const { message, conversation, projectContext } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await llmService.coaching({
      message,
      conversation: conversation || [],
      projectContext
    });
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ error: result.error || 'Failed to generate coaching response' });
    }
  } catch (error) {
    console.error('Error in coaching conversation:', error);
    res.status(500).json({ error: 'Failed to process coaching message' });
  }
});

export default router;
