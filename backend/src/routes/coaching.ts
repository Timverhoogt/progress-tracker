import { Router } from 'express';
import { initializeDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();
const db = initializeDatabase();

// Validation schemas
const CoachingSessionSchema = z.object({
  session_type: z.string().min(1),
  session_topic: z.string().optional(),
  user_message: z.string().min(1),
  coaching_style: z.enum(['supportive', 'challenging', 'analytical', 'encouraging']).default('supportive'),
  mood_context: z.string().optional()
});

const SessionFeedbackSchema = z.object({
  user_feedback_rating: z.number().int().min(1).max(5),
  user_feedback_notes: z.string().optional(),
  session_outcome: z.string().optional()
});

// GET /api/coaching/sessions - Get coaching session history
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const sessionType = req.query.session_type;
    const limit = parseInt(String(req.query.limit || '50')) || 50;
    
    let query = 'SELECT * FROM coaching_sessions WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (sessionType) {
      query += ' AND session_type = ?';
      params.push(sessionType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coaching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch coaching sessions' });
  }
});

// GET /api/coaching/sessions/stats - Get coaching session statistics
router.get('/sessions/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(user_feedback_rating) as avg_rating,
        AVG(session_duration_seconds) as avg_duration_seconds,
        session_type,
        COUNT(*) as type_count,
        AVG(user_feedback_rating) as type_avg_rating
      FROM coaching_sessions 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY session_type
      ORDER BY type_count DESC
    `, [userId, startDateStr]);
    
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(user_feedback_rating) as overall_avg_rating,
        COUNT(CASE WHEN user_feedback_rating >= 4 THEN 1 END) as positive_sessions,
        coaching_style,
        COUNT(*) as style_count,
        AVG(user_feedback_rating) as style_avg_rating
      FROM coaching_sessions 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY coaching_style
      ORDER BY style_avg_rating DESC
    `, [userId, startDateStr]);
    
    res.json({
      by_type: result.rows,
      by_style: summary.rows,
      period_days: days
    });
  } catch (error) {
    console.error('Error fetching coaching stats:', error);
    res.status(500).json({ error: 'Failed to fetch coaching statistics' });
  }
});

// GET /api/coaching/context - Get coaching context for AI
router.get('/context', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';

    // Extended mood data (30 days for better trend analysis)
    const recentMood = await db.query(`
      SELECT * FROM mood_tracking
      WHERE user_id = ? AND mood_date >= date('now', '-30 days')
      ORDER BY mood_date DESC
      LIMIT 30
    `, [userId]);

    // Get current achievements
    const activeAchievements = await db.query(`
      SELECT * FROM achievements
      WHERE user_id = ? AND status = 'active'
      ORDER BY priority_level DESC
      LIMIT 5
    `, [userId]);

    // Get skill gaps
    const skillGaps = await db.query(`
      SELECT *, (target_level - current_level) as gap_size
      FROM skills_assessment
      WHERE user_id = ? AND current_level < target_level
      ORDER BY gap_size DESC
      LIMIT 5
    `, [userId]);

    // Get recent coaching preferences
    const preferences = await db.query(`
      SELECT preference_category, preference_key, preference_value
      FROM user_preferences
      WHERE user_id = ? AND preference_category IN ('coaching', 'wellbeing', 'learning')
    `, [userId]);

    // Get recent notes/projects for context
    const recentNotes = await db.query(`
      SELECT content, enhanced_content, created_at
      FROM notes
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get recent reflection insights
    const recentReflections = await db.query(`
      SELECT responses, insights_extracted, ai_analysis, reflection_date
      FROM reflection_responses
      WHERE user_id = ?
      ORDER BY reflection_date DESC
      LIMIT 3
    `, [userId]);

    // NEW: Get active todos across all projects
    const activeTodos = await db.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
             p.name as project_name, p.status as project_status
      FROM todos t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status IN ('pending', 'in_progress')
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        t.due_date ASC
      LIMIT 20
    `);

    // NEW: Get recent workload data (last 14 days)
    const recentWorkload = await db.query(`
      SELECT work_date, start_time, end_time, intensity_level,
             focus_level, productivity_score, tasks_completed, notes
      FROM workload_tracking
      WHERE user_id = ? AND work_date >= date('now', '-14 days')
      ORDER BY work_date DESC
    `, [userId]);

    // NEW: Get recent gratitude entries (last 10)
    const recentGratitude = await db.query(`
      SELECT gratitude_date, response, category, created_at
      FROM gratitude_entries
      WHERE user_id = ?
      ORDER BY gratitude_date DESC
      LIMIT 10
    `, [userId]);

    // NEW: Get coping strategies and recent usage
    const copingStrategies = await db.query(`
      SELECT cs.id, cs.strategy_name, cs.strategy_category, cs.description,
             COUNT(csu.id) as times_used,
             AVG(csu.effectiveness_rating) as avg_effectiveness
      FROM coping_strategies cs
      LEFT JOIN coping_strategy_usage csu ON cs.id = csu.strategy_id
        AND csu.used_at >= datetime('now', '-30 days')
      WHERE cs.user_id = ?
      GROUP BY cs.id
      ORDER BY avg_effectiveness DESC, times_used DESC
      LIMIT 10
    `, [userId]);

    // NEW: Get project portfolio overview
    const projectSummary = await db.query(`
      SELECT p.id, p.name, p.status, p.description,
             COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_todos,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_todos,
             COUNT(CASE WHEN t.priority = 'high' AND t.status != 'completed' THEN 1 END) as high_priority_pending
      FROM projects p
      LEFT JOIN todos t ON p.id = t.project_id
      WHERE p.status IN ('active', 'planning')
      GROUP BY p.id
      ORDER BY p.status DESC, pending_todos DESC
    `);

    // NEW: Get work preferences for better context
    const workPreferences = await db.query(`
      SELECT * FROM work_preferences
      WHERE user_id = ?
    `, [userId]);

    res.json({
      recent_mood: recentMood.rows,
      active_achievements: activeAchievements.rows,
      skill_gaps: skillGaps.rows,
      preferences: preferences.rows.reduce((acc, pref) => {
        if (!acc[pref.preference_category]) acc[pref.preference_category] = {};
        acc[pref.preference_category][pref.preference_key] = pref.preference_value;
        return acc;
      }, {}),
      recent_work: recentNotes.rows,
      recent_reflections: recentReflections.rows,

      // Enhanced context data
      active_todos: activeTodos.rows,
      recent_workload: recentWorkload.rows,
      recent_gratitude: recentGratitude.rows,
      coping_strategies: copingStrategies.rows,
      project_summary: projectSummary.rows,
      work_preferences: workPreferences.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching coaching context:', error);
    res.status(500).json({ error: 'Failed to fetch coaching context' });
  }
});

// POST /api/coaching/sessions - Create new coaching session
router.post('/sessions', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = CoachingSessionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      session_type, 
      session_topic, 
      user_message, 
      coaching_style, 
      mood_context 
    } = validation.data;
    
    const id = uuidv4();
    
    // Get coaching context for AI response
    const contextResponse = await fetch(`${req.protocol}://${req.get('host')}/api/coaching/context?user_id=${userId}`);
    const context = await contextResponse.json();
    
    // Generate AI coaching response
    const llmCoaching = require('../services/llm-coaching').default;
    const coachingResponse = await llmCoaching.generateCoachingResponse({
      user_message,
      session_type,
      coaching_style,
      context,
      mood_context
    });
    
    const ai_response = coachingResponse.ai_response;
    
    await db.query(`
      INSERT INTO coaching_sessions (
        id, user_id, session_type, session_topic, user_message, ai_response, 
        coaching_style, mood_context, context_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, session_type, session_topic, user_message, ai_response, coaching_style, mood_context, JSON.stringify(context)]);
    
    const result = await db.query(
      'SELECT * FROM coaching_sessions WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating coaching session:', error);
    res.status(500).json({ error: 'Failed to create coaching session' });
  }
});

// POST /api/coaching/sessions/:id/feedback - Add feedback to coaching session
router.post('/sessions/:id/feedback', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const validation = SessionFeedbackSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { user_feedback_rating, user_feedback_notes, session_outcome } = validation.data;
    
    const result = await db.query(`
      UPDATE coaching_sessions 
      SET user_feedback_rating = ?, user_feedback_notes = ?, session_outcome = ?
      WHERE id = ? AND user_id = ?
    `, [user_feedback_rating, user_feedback_notes, session_outcome, id, userId]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Coaching session not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM coaching_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error adding session feedback:', error);
    res.status(500).json({ error: 'Failed to add session feedback' });
  }
});

// GET /api/coaching/insights - Get AI coaching insights based on patterns
router.get('/insights', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    
    // Analyze mood patterns
    const moodTrends = await db.query(`
      SELECT 
        AVG(mood_score) as avg_mood,
        AVG(stress_level) as avg_stress,
        COUNT(CASE WHEN mood_score <= 4 THEN 1 END) as low_mood_days,
        COUNT(*) as total_days
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= date('now', '-30 days')
    `, [userId]);
    
    // Analyze achievement progress
    const achievementProgress = await db.query(`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        AVG(CASE WHEN target_value > 0 THEN (current_value / target_value) * 100 END) as avg_progress
      FROM achievements 
      WHERE user_id = ? AND status IN ('active', 'completed')
    `, [userId]);
    
    // Analyze skill development
    const skillProgress = await db.query(`
      SELECT 
        COUNT(*) as total_skills,
        COUNT(CASE WHEN current_level >= target_level THEN 1 END) as skills_at_target,
        AVG(target_level - current_level) as avg_skill_gap
      FROM skills_assessment 
      WHERE user_id = ?
    `, [userId]);
    
    // Generate insights based on patterns
    const insights = [];
    const mood = moodTrends.rows[0];
    const achievements = achievementProgress.rows[0];
    const skills = skillProgress.rows[0];
    
    if (mood.avg_mood < 6) {
      insights.push({
        type: 'wellbeing',
        priority: 'high',
        message: 'Your mood has been lower than usual recently. Consider focusing on self-care and stress management.',
        suggestion: 'Try scheduling regular breaks and engaging in activities that boost your energy.'
      });
    }
    
    if (mood.avg_stress > 7) {
      insights.push({
        type: 'stress',
        priority: 'high',
        message: 'Your stress levels have been elevated. This might impact your productivity and wellbeing.',
        suggestion: 'Consider implementing stress-reduction techniques or adjusting your workload.'
      });
    }
    
    if (achievements.avg_progress < 50) {
      insights.push({
        type: 'achievements',
        priority: 'medium',
        message: 'Your achievement progress could benefit from more focused effort.',
        suggestion: 'Consider breaking down larger goals into smaller, more manageable milestones.'
      });
    }
    
    if (skills.avg_skill_gap > 2) {
      insights.push({
        type: 'skills',
        priority: 'medium',
        message: 'There are significant gaps between your current and target skill levels.',
        suggestion: 'Focus on developing 1-2 key skills rather than trying to improve everything at once.'
      });
    }
    
    res.json({
      insights,
      data_summary: {
        mood_trends: mood,
        achievement_progress: achievements,
        skill_progress: skills
      }
    });
  } catch (error) {
    console.error('Error generating coaching insights:', error);
    res.status(500).json({ error: 'Failed to generate coaching insights' });
  }
});

// DELETE /api/coaching/sessions/:id - Delete coaching session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM coaching_sessions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Coaching session not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting coaching session:', error);
    res.status(500).json({ error: 'Failed to delete coaching session' });
  }
});

// POST /api/coaching/mood-adaptive - Get mood-adaptive coaching response
router.post('/mood-adaptive', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Import the coaching service
    const coachingService = await import('../services/llm-coaching');
    
    // Generate mood-adaptive coaching response
    const response = await coachingService.default.generateMoodAdaptiveCoaching(String(message), String(userId));
    
    // Save the session
    const sessionId = uuidv4();
    await db.query(`
      INSERT INTO coaching_sessions (
        id, user_id, session_type, session_topic, 
        user_message, ai_response, coaching_style, 
        context_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      userId,
      'mood_adaptive',
      'Mood-Adaptive Coaching',
      message,
      response.ai_response,
      'mood_adaptive',
      JSON.stringify({
        coaching_insights: response.coaching_insights,
        suggested_actions: response.suggested_actions,
        follow_up_questions: response.follow_up_questions
      }),
      new Date().toISOString()
    ]);
    
    res.json({
      session_id: sessionId,
      ai_response: response.ai_response,
      coaching_insights: response.coaching_insights,
      suggested_actions: response.suggested_actions,
      follow_up_questions: response.follow_up_questions,
      coaching_style: 'mood_adaptive'
    });
  } catch (error) {
    console.error('Error in mood-adaptive coaching:', error);
    res.status(500).json({ error: 'Failed to generate mood-adaptive coaching response' });
  }
});

export default router;
