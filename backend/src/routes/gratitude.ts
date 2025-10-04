import { Router } from 'express';
import { getDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// Validation schemas
const GratitudeEntrySchema = z.object({
  gratitude_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().optional(),
  prompt: z.string(),
  response: z.string(),
  mood_before: z.number().int().min(1).max(10).optional(),
  mood_after: z.number().int().min(1).max(10).optional(),
  achievement_id: z.string().optional(),
  tags: z.string().optional()
});

const GratitudePromptSchema = z.object({
  category: z.string().optional(),
  mood_level: z.number().int().min(1).max(10).optional(),
  recent_achievements: z.boolean().optional(),
  personal_focus: z.string().optional()
});

// GET /api/gratitude - Get gratitude entries
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const limit = parseInt(String(req.query.limit || '30')) || 30;
    const category = req.query.category;
    
    let query = 'SELECT * FROM gratitude_entries WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (startDate && endDate) {
      query += ' AND gratitude_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND gratitude_date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND gratitude_date <= ?';
      params.push(endDate);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY gratitude_date DESC LIMIT ?';
    params.push(limit);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gratitude entries:', error);
    res.status(500).json({ error: 'Failed to fetch gratitude entries' });
  }
});

// GET /api/gratitude/today - Get today's gratitude entry
router.get('/today', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(
      'SELECT * FROM gratitude_entries WHERE user_id = ? AND gratitude_date = ?',
      [userId, today]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No gratitude entry for today' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching today\'s gratitude entry:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s gratitude entry' });
  }
});

// GET /api/gratitude/prompts - Get AI-generated gratitude prompts
router.get('/prompts', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const validation = GratitudePromptSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { category, mood_level, recent_achievements, personal_focus } = validation.data;
    
    // Get user context for personalized prompts
    const [moodData, achievementData, gratitudeHistory] = await Promise.all([
      db.query(`
        SELECT mood_level, energy_level, stress_level, motivation_level
        FROM mood_tracking 
        WHERE user_id = ? AND mood_date >= date('now', '-7 days')
        ORDER BY mood_date DESC LIMIT 1
      `, [userId]).catch(() => ({ rows: [] })),
      
      recent_achievements ? db.query(`
        SELECT title, description, completion_date
        FROM achievements 
        WHERE user_id = ? AND status = 'completed' AND completion_date >= date('now', '-30 days')
        ORDER BY completion_date DESC LIMIT 3
      `, [userId]).catch(() => ({ rows: [] })) : Promise.resolve({ rows: [] }),
      
      db.query(`
        SELECT category, COUNT(*) as count
        FROM gratitude_entries 
        WHERE user_id = ? AND gratitude_date >= date('now', '-30 days')
        GROUP BY category
        ORDER BY count DESC
      `, [userId]).catch(() => ({ rows: [] }))
    ]);
    
    const prompts = await generateGratitudePrompts({
      category,
      mood_level,
      recent_achievements: achievementData.rows,
      personal_focus,
      mood_context: moodData.rows[0] || null,
      gratitude_history: gratitudeHistory.rows
    });
    
    res.json(prompts);
  } catch (error) {
    console.error('Error generating gratitude prompts:', error);
    res.status(500).json({ error: 'Failed to generate gratitude prompts' });
  }
});

// GET /api/gratitude/achievement-based - Get achievement-based gratitude prompts
router.get('/achievement-based', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    
    const achievements = await db.query(`
      SELECT 
        id,
        title,
        description,
        completion_date,
        impact_score,
        category
      FROM achievements 
      WHERE user_id = ? AND status = 'completed' AND completion_date >= date('now', '-${days} days')
      ORDER BY completion_date DESC
    `, [userId]);
    
    if (achievements.rows.length === 0) {
      return res.json({
        prompts: [],
        message: 'No recent achievements found. Consider setting some goals to celebrate!'
      });
    }
    
    const prompts = await generateAchievementBasedPrompts(achievements.rows);
    res.json(prompts);
  } catch (error) {
    console.error('Error generating achievement-based prompts:', error);
    res.status(500).json({ error: 'Failed to generate achievement-based prompts' });
  }
});

// GET /api/gratitude/reframing - Get positive reframing suggestions
router.get('/reframing', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const challenge = req.query.challenge as string;
    
    if (!challenge) {
      return res.status(400).json({ error: 'Challenge description is required' });
    }
    
    // Get user's recent mood and stress data for context
    const moodData = await db.query(`
      SELECT mood_level, stress_level, energy_level, notes
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= date('now', '-7 days')
      ORDER BY mood_date DESC LIMIT 3
    `, [userId]);
    
    const reframing = await generatePositiveReframing(challenge, moodData.rows);
    res.json(reframing);
  } catch (error) {
    console.error('Error generating positive reframing:', error);
    res.status(500).json({ error: 'Failed to generate positive reframing' });
  }
});

// GET /api/gratitude/encouragement - Get personalized encouragement
router.get('/encouragement', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    
    // Get user context
    const [moodData, achievementData, workloadData] = await Promise.all([
      db.query(`
        SELECT mood_level, stress_level, energy_level, motivation_level, notes
        FROM mood_tracking 
        WHERE user_id = ? AND mood_date >= date('now', '-7 days')
        ORDER BY mood_date DESC LIMIT 1
      `, [userId]).catch(() => ({ rows: [] })),
      
      db.query(`
        SELECT COUNT(*) as recent_achievements
        FROM achievements 
        WHERE user_id = ? AND status = 'completed' AND completion_date >= date('now', '-30 days')
      `, [userId]).catch(() => ({ rows: [{ recent_achievements: 0 }] })),
      
      db.query(`
        SELECT AVG(intensity_level) as avg_intensity, AVG(productivity_score) as avg_productivity
        FROM workload_tracking 
        WHERE user_id = ? AND work_date >= date('now', '-7 days')
      `, [userId]).catch(() => ({ rows: [{ avg_intensity: 5, avg_productivity: 5 }] }))
    ]);
    
    const encouragement = await generatePersonalizedEncouragement({
      mood_context: moodData.rows[0] || null,
      recent_achievements: achievementData.rows[0]?.recent_achievements || 0,
      work_context: workloadData.rows[0] || null
    });
    
    res.json(encouragement);
  } catch (error) {
    console.error('Error generating encouragement:', error);
    res.status(500).json({ error: 'Failed to generate encouragement' });
  }
});

// GET /api/gratitude/stats - Get gratitude statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT gratitude_date) as days_with_gratitude,
        AVG(mood_after - COALESCE(mood_before, 5)) as avg_mood_improvement,
        COUNT(CASE WHEN achievement_id IS NOT NULL THEN 1 END) as achievement_based_entries,
        COUNT(CASE WHEN category = 'personal' THEN 1 END) as personal_entries,
        COUNT(CASE WHEN category = 'professional' THEN 1 END) as professional_entries,
        COUNT(CASE WHEN category = 'relationships' THEN 1 END) as relationship_entries,
        COUNT(CASE WHEN category = 'health' THEN 1 END) as health_entries
      FROM gratitude_entries 
      WHERE user_id = ? AND gratitude_date >= date('now', '-${days} days')
    `, [userId]);
    
    const categoryStats = await db.query(`
      SELECT 
        category,
        COUNT(*) as count,
        AVG(mood_after - COALESCE(mood_before, 5)) as avg_mood_improvement
      FROM gratitude_entries 
      WHERE user_id = ? AND gratitude_date >= date('now', '-${days} days')
      GROUP BY category
      ORDER BY count DESC
    `, [userId]);
    
    res.json({
      summary: stats.rows[0],
      category_breakdown: categoryStats.rows
    });
  } catch (error) {
    console.error('Error fetching gratitude stats:', error);
    res.status(500).json({ error: 'Failed to fetch gratitude statistics' });
  }
});

// POST /api/gratitude - Create new gratitude entry
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const validation = GratitudeEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      gratitude_date, 
      category, 
      prompt, 
      response, 
      mood_before, 
      mood_after, 
      achievement_id, 
      tags 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO gratitude_entries (
        id, user_id, gratitude_date, category, prompt, response,
        mood_before, mood_after, achievement_id, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, gratitude_date, category, prompt, response, mood_before, mood_after, achievement_id, tags]);
    
    const result = await db.query(
      'SELECT * FROM gratitude_entries WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating gratitude entry:', error);
    res.status(500).json({ error: 'Failed to create gratitude entry' });
  }
});

// PUT /api/gratitude/:id - Update gratitude entry
router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    const validation = GratitudeEntrySchema.partial().safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const updateData = validation.data;
    const updateFields: string[] = [];
    const updateValues = [];
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateValues.push(userId, id);
    
    const result = await db.query(`
      UPDATE gratitude_entries 
      SET ${updateFields.join(', ')}, updated_at = datetime('now')
      WHERE user_id = ? AND id = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Gratitude entry not found' });
    }
    
    const updated = await db.query(
      'SELECT * FROM gratitude_entries WHERE user_id = ? AND id = ?',
      [userId, id]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating gratitude entry:', error);
    res.status(500).json({ error: 'Failed to update gratitude entry' });
  }
});

// DELETE /api/gratitude/:id - Delete gratitude entry
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM gratitude_entries WHERE user_id = ? AND id = ?',
      [userId, id]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Gratitude entry not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gratitude entry:', error);
    res.status(500).json({ error: 'Failed to delete gratitude entry' });
  }
});

// Generate AI-powered gratitude prompts
async function generateGratitudePrompts(context: any) {
  try {
    const llmService = await import('../services/llm');
    
    const prompt = `You are an AI gratitude coach helping a Continuous Improvement Advisor at Evos Amsterdam develop a positive mindset through gratitude practice.

User Context:
- Category preference: ${context.category || 'any'}
- Current mood level: ${context.mood_level || 'not specified'}
- Recent achievements: ${context.recent_achievements?.length || 0} in the last 30 days
- Personal focus: ${context.personal_focus || 'not specified'}
- Recent mood data: ${context.mood_context ? JSON.stringify(context.mood_context) : 'not available'}
- Gratitude history: ${context.gratitude_history?.length || 0} entries in last 30 days

Generate 5 personalized gratitude prompts that are:
1. Relevant to their current situation and mood
2. Specific and actionable
3. Varied in focus (personal, professional, relationships, health, growth)
4. Encouraging and positive
5. Appropriate for their experience level with gratitude practice

Return as JSON array with this structure:
[
  {
    "prompt": "Specific gratitude question or prompt",
    "category": "personal|professional|relationships|health|growth|general",
    "difficulty": "beginner|intermediate|advanced",
    "focus_area": "Brief description of what this prompt focuses on",
    "suggested_duration": "1-5 minutes",
    "follow_up_questions": ["Optional follow-up question 1", "Optional follow-up question 2"]
  }
]

Make the prompts feel personal and relevant to their work in continuous improvement and their current emotional state.`;

    const response = await llmService.default.enhanceWithAI(prompt, 'gratitude_prompts');
    
    try {
      let cleanResponse = response;
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const prompts = JSON.parse(cleanResponse);
      return { prompts, generated_at: new Date().toISOString() };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback to default prompts
      return {
        prompts: [
          {
            prompt: "What's one thing that went well today that you're grateful for?",
            category: "general",
            difficulty: "beginner",
            focus_area: "Daily positive moments",
            suggested_duration: "2-3 minutes",
            follow_up_questions: ["How did this make you feel?", "What made this moment special?"]
          },
          {
            prompt: "Who in your life are you most grateful for right now, and why?",
            category: "relationships",
            difficulty: "intermediate",
            focus_area: "Meaningful relationships",
            suggested_duration: "3-4 minutes",
            follow_up_questions: ["How do they support your growth?", "What would you like to tell them?"]
          },
          {
            prompt: "What skill or ability are you grateful to have developed recently?",
            category: "professional",
            difficulty: "intermediate",
            focus_area: "Professional growth",
            suggested_duration: "3-5 minutes",
            follow_up_questions: ["How has this skill helped you?", "What's next in your development?"]
          },
          {
            prompt: "What's something about your health or body that you're grateful for today?",
            category: "health",
            difficulty: "beginner",
            focus_area: "Physical wellbeing",
            suggested_duration: "2-3 minutes",
            follow_up_questions: ["How does this support your goals?", "What does this enable you to do?"]
          },
          {
            prompt: "What challenge or obstacle are you grateful for because it helped you grow?",
            category: "growth",
            difficulty: "advanced",
            focus_area: "Learning from difficulties",
            suggested_duration: "4-5 minutes",
            follow_up_questions: ["What did you learn about yourself?", "How are you stronger now?"]
          }
        ],
        generated_at: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error generating gratitude prompts:', error);
    throw error;
  }
}

// Generate achievement-based gratitude prompts
async function generateAchievementBasedPrompts(achievements: any[]) {
  const prompts = achievements.map(achievement => ({
    achievement_id: achievement.id,
    achievement_title: achievement.title,
    prompt: `Take a moment to appreciate your recent achievement: "${achievement.title}". What does completing this mean to you?`,
    category: "professional",
    difficulty: "intermediate",
    focus_area: "Celebrating accomplishments",
    suggested_duration: "3-4 minutes",
    follow_up_questions: [
      "How did this achievement make you feel?",
      "What skills did you develop in the process?",
      "How does this contribute to your larger goals?",
      "Who helped you along the way?"
    ],
    achievement_context: {
      title: achievement.title,
      description: achievement.description,
      completion_date: achievement.completion_date,
      impact_score: achievement.impact_score,
      category: achievement.category
    }
  }));
  
  return {
    prompts,
    total_achievements: achievements.length,
    generated_at: new Date().toISOString()
  };
}

// Generate positive reframing suggestions
async function generatePositiveReframing(challenge: string, moodContext: any[]) {
  try {
    const llmService = await import('../services/llm');
    
    const prompt = `You are an AI positivity coach helping reframe challenges in a constructive way.

Challenge description: "${challenge}"

Recent mood context: ${moodContext.length > 0 ? JSON.stringify(moodContext) : 'No recent mood data available'}

Provide 3 different positive reframing perspectives for this challenge. Each should:
1. Acknowledge the difficulty honestly
2. Find a constructive angle or learning opportunity
3. Suggest actionable steps forward
4. Maintain an encouraging but realistic tone

Return as JSON with this structure:
{
  "reframings": [
    {
      "title": "Brief title for this reframing",
      "perspective": "The positive reframing of the challenge",
      "learning_opportunity": "What can be learned from this situation",
      "action_steps": ["Step 1", "Step 2", "Step 3"],
      "encouragement": "Motivational message to move forward"
    }
  ],
  "general_advice": "Overall advice for dealing with this type of challenge",
  "gratitude_angle": "How this challenge might be something to be grateful for in the future"
}`;

    const response = await llmService.default.enhanceWithAI(prompt, 'positive_reframing');
    
    try {
      let cleanResponse = response;
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const reframing = JSON.parse(cleanResponse);
      return { ...reframing, generated_at: new Date().toISOString() };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return {
        reframings: [
          {
            title: "Growth Opportunity",
            perspective: "This challenge is an opportunity to develop new skills and resilience.",
            learning_opportunity: "You can learn problem-solving, patience, and adaptability.",
            action_steps: ["Break the challenge into smaller parts", "Seek support from others", "Focus on what you can control"],
            encouragement: "Every challenge you overcome makes you stronger and more capable."
          },
          {
            title: "Character Building",
            perspective: "Difficult situations reveal your true character and values.",
            learning_opportunity: "You can discover your strengths and areas for growth.",
            action_steps: ["Reflect on your values", "Identify your strengths", "Practice self-compassion"],
            encouragement: "You have overcome challenges before and you will overcome this one too."
          },
          {
            title: "Future Gratitude",
            perspective: "This challenge will become a story of triumph and growth.",
            learning_opportunity: "You can develop wisdom and empathy for others facing similar challenges.",
            action_steps: ["Keep a journal of your progress", "Share your experience with others", "Celebrate small wins"],
            encouragement: "One day, you'll look back on this challenge with gratitude for how it shaped you."
          }
        ],
        general_advice: "Remember that challenges are temporary, but the growth they bring is permanent. Focus on what you can control and take it one step at a time.",
        gratitude_angle: "This challenge is preparing you for future success and will make you more grateful for the good times ahead.",
        generated_at: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error generating positive reframing:', error);
    throw error;
  }
}

// Generate personalized encouragement
async function generatePersonalizedEncouragement(context: any) {
  try {
    const llmService = await import('../services/llm');
    
    const prompt = `You are an AI encouragement coach providing personalized motivational support.

User Context:
- Recent mood: ${context.mood_context ? JSON.stringify(context.mood_context) : 'not available'}
- Recent achievements: ${context.recent_achievements} in the last 30 days
- Work context: ${context.work_context ? JSON.stringify(context.work_context) : 'not available'}

Generate personalized encouragement that:
1. Acknowledges their current state
2. Highlights their strengths and recent wins
3. Provides specific, actionable motivation
4. Is warm, genuine, and supportive
5. Includes a gratitude element

Return as JSON with this structure:
{
  "encouragement_message": "Main encouraging message",
  "strengths_highlighted": ["Strength 1", "Strength 2", "Strength 3"],
  "recent_wins": ["Win 1", "Win 2"],
  "actionable_motivation": "Specific next steps or focus areas",
  "gratitude_reminder": "Something to be grateful for right now",
  "affirmation": "Positive affirmation to repeat",
  "encouragement_type": "achievement|growth|resilience|gratitude|balance"
}`;

    const response = await llmService.default.enhanceWithAI(prompt, 'encouragement');
    
    try {
      let cleanResponse = response;
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const encouragement = JSON.parse(cleanResponse);
      return { ...encouragement, generated_at: new Date().toISOString() };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return {
        encouragement_message: "You're doing great work, and your dedication to continuous improvement is inspiring. Every step forward, no matter how small, is progress worth celebrating.",
        strengths_highlighted: ["Commitment to growth", "Self-awareness", "Resilience"],
        recent_wins: ["Consistent effort", "Learning mindset"],
        actionable_motivation: "Keep focusing on one small improvement each day. Your future self will thank you for the effort you're putting in now.",
        gratitude_reminder: "Be grateful for your ability to learn, grow, and make positive changes in your life.",
        affirmation: "I am capable, I am growing, and I am making a positive difference.",
        encouragement_type: "growth",
        generated_at: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error generating encouragement:', error);
    throw error;
  }
}

export default router;

