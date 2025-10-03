import { Router } from 'express';
import { pool } from '../server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// AI Mood Pattern Analysis Function
async function analyzeMoodPatterns(data: any) {
  try {
    // Import the LLM service
    const llmService = await import('../services/llm');
    
    const prompt = `You are an AI wellness coach analyzing mood patterns for a Continuous Improvement Advisor at Evos Amsterdam. 

Analyze the following mood data and provide insights:

Mood Data:
${JSON.stringify(data, null, 2)}

Please provide a comprehensive analysis in the following JSON format:

{
  "analysis": "Overall summary of mood patterns and key insights",
  "trends": [
    {
      "type": "weekly_pattern",
      "description": "Description of weekly mood patterns",
      "confidence": "high|medium|low",
      "data": "Supporting data or examples"
    },
    {
      "type": "stress_correlation", 
      "description": "How stress levels correlate with other factors",
      "confidence": "high|medium|low",
      "data": "Supporting data or examples"
    },
    {
      "type": "energy_patterns",
      "description": "Energy level patterns and insights",
      "confidence": "high|medium|low", 
      "data": "Supporting data or examples"
    }
  ],
  "triggers": [
    {
      "trigger": "Specific trigger identified",
      "frequency": "How often it occurs",
      "impact": "Positive|Negative|Mixed",
      "description": "How this trigger affects mood",
      "recommendation": "Suggested action"
    }
  ],
  "recommendations": [
    {
      "category": "stress_management|energy_optimization|mood_improvement|work_life_balance",
      "priority": "high|medium|low",
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "actionable_steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "insights": [
    {
      "type": "positive|concerning|neutral",
      "title": "Insight title",
      "description": "Detailed insight description",
      "action_required": true|false
    }
  ]
}

Focus on:
1. Identifying patterns in mood, energy, and stress levels
2. Correlating triggers with mood changes
3. Finding effective coping strategies
4. Providing actionable recommendations for improvement
5. Considering the professional context of continuous improvement work

Be specific and actionable in your recommendations.`;

    const response = await llmService.default.enhanceWithAI(prompt, 'mood_analysis');
    
    try {
      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response;
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      // Try to parse the JSON response
      const analysis = JSON.parse(cleanResponse);
      return analysis;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response was:', response);
      // If JSON parsing fails, return a structured response
      return {
        analysis: response,
        trends: [],
        triggers: [],
        recommendations: [],
        insights: []
      };
    }
  } catch (error) {
    console.error('Error in AI mood analysis:', error);
    return {
      analysis: "AI analysis temporarily unavailable. Please try again later.",
      trends: [],
      triggers: [],
      recommendations: [],
      insights: []
    };
  }
}

// Validation schemas
const MoodEntrySchema = z.object({
  mood_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood_score: z.number().int().min(1).max(10),
  energy_level: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  motivation_level: z.number().int().min(1).max(10).optional(),
  mood_tags: z.string().optional(),
  notes: z.string().optional(),
  triggers: z.string().optional(),
  coping_strategies_used: z.string().optional()
});

const UpdateMoodEntrySchema = z.object({
  mood_score: z.number().int().min(1).max(10).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  motivation_level: z.number().int().min(1).max(10).optional(),
  mood_tags: z.string().optional(),
  notes: z.string().optional(),
  triggers: z.string().optional(),
  coping_strategies_used: z.string().optional()
});

// GET /api/mood - Get mood entries
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const limit = parseInt(String(req.query.limit || '30')) || 30;
    
    let query = 'SELECT * FROM mood_tracking WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (startDate && endDate) {
      query += ' AND mood_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND mood_date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND mood_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY mood_date DESC LIMIT ?';
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// GET /api/mood/latest - Get latest mood entry
router.get('/latest', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const result = await pool.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? ORDER BY mood_date DESC LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No mood entries found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching latest mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch latest mood entry' });
  }
});

// GET /api/mood/today - Get today's mood entry
router.get('/today', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, today]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching today\'s mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s mood entry' });
  }
});

// GET /api/mood/stats - Get mood statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_score) as avg_mood_score,
        AVG(energy_level) as avg_energy_level,
        AVG(stress_level) as avg_stress_level,
        AVG(motivation_level) as avg_motivation_level,
        MIN(mood_score) as min_mood_score,
        MAX(mood_score) as max_mood_score,
        COUNT(CASE WHEN mood_score >= 7 THEN 1 END) as good_mood_days,
        COUNT(CASE WHEN mood_score <= 4 THEN 1 END) as low_mood_days,
        COUNT(CASE WHEN stress_level >= 7 THEN 1 END) as high_stress_days
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
    `, [userId, startDateStr]);
    
    // Get mood trends (weekly averages)
    const trends = await pool.query(`
      SELECT 
        strftime('%Y-%W', mood_date) as week,
        AVG(mood_score) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        COUNT(*) as entries_count
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      GROUP BY strftime('%Y-%W', mood_date)
      ORDER BY week
    `, [userId, startDateStr]);
    
    res.json({
      summary: result.rows[0],
      weekly_trends: trends.rows
    });
  } catch (error) {
    console.error('Error fetching mood stats:', error);
    res.status(500).json({ error: 'Failed to fetch mood statistics' });
  }
});

// GET /api/mood/patterns - Get mood patterns and insights
router.get('/patterns', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '90')) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get day-of-week patterns
    const dayPatterns = await pool.query(`
      SELECT 
        CASE strftime('%w', mood_date)
          WHEN '0' THEN 'Sunday'
          WHEN '1' THEN 'Monday'
          WHEN '2' THEN 'Tuesday'
          WHEN '3' THEN 'Wednesday'
          WHEN '4' THEN 'Thursday'
          WHEN '5' THEN 'Friday'
          WHEN '6' THEN 'Saturday'
        END as day_of_week,
        AVG(mood_score) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        COUNT(*) as count
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      GROUP BY strftime('%w', mood_date)
      ORDER BY strftime('%w', mood_date)
    `, [userId, startDateStr]);
    
    // Get common triggers
    const triggers = await pool.query(`
      SELECT triggers, COUNT(*) as frequency
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ? AND triggers IS NOT NULL AND triggers != ''
      GROUP BY triggers
      ORDER BY frequency DESC
      LIMIT 10
    `, [userId, startDateStr]);
    
    // Get effective coping strategies
    const copingStrategies = await pool.query(`
      SELECT coping_strategies_used, AVG(mood_score) as avg_mood_after, COUNT(*) as usage_count
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ? AND coping_strategies_used IS NOT NULL AND coping_strategies_used != ''
      GROUP BY coping_strategies_used
      ORDER BY avg_mood_after DESC, usage_count DESC
      LIMIT 10
    `, [userId, startDateStr]);
    
    res.json({
      day_of_week_patterns: dayPatterns.rows,
      common_triggers: triggers.rows,
      effective_coping_strategies: copingStrategies.rows
    });
  } catch (error) {
    console.error('Error fetching mood patterns:', error);
    res.status(500).json({ error: 'Failed to fetch mood patterns' });
  }
});

// GET /api/mood/ai-analysis - Get AI-powered mood pattern analysis
router.get('/ai-analysis', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '90')) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get detailed mood data for AI analysis
    const moodData = await pool.query(`
      SELECT 
        mood_date,
        mood_score,
        energy_level,
        stress_level,
        motivation_level,
        mood_tags,
        notes,
        triggers,
        coping_strategies_used,
        strftime('%w', mood_date) as day_of_week,
        strftime('%H', created_at) as hour_of_day
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      ORDER BY mood_date ASC
    `, [userId, startDateStr]);
    
    if (moodData.rows.length === 0) {
      return res.json({
        analysis: "Not enough mood data for AI analysis yet. Please log more mood entries to get personalized insights.",
        trends: [],
        triggers: [],
        recommendations: []
      });
    }
    
    // Prepare data for AI analysis
    const analysisData = {
      mood_entries: moodData.rows,
      analysis_period: {
        start_date: startDateStr,
        end_date: new Date().toISOString().split('T')[0],
        total_entries: moodData.rows.length
      },
      user_context: {
        role: "Continuous Improvement Advisor at Evos Amsterdam",
        industry: "Petrochemical storage operations"
      }
    };
    
    // Call AI service for pattern analysis
    const aiAnalysis = await analyzeMoodPatterns(analysisData);
    
    res.json(aiAnalysis);
  } catch (error) {
    console.error('Error fetching AI mood analysis:', error);
    res.status(500).json({ error: 'Failed to fetch AI mood analysis' });
  }
});

// GET /api/mood/:date - Get mood entry for specific date
router.get('/:date', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await pool.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, date]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found for this date' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch mood entry' });
  }
});

// POST /api/mood - Create new mood entry
router.post('/', async (req, res) => {
  try {
    console.log('Mood API: Received request', req.body);
    const userId = req.query.user_id || 'default';
    const validation = MoodEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      console.log('Mood API: Validation failed', validation.error.errors);
      return res.status(400).json({ error: validation.error.errors });
    }
    
    console.log('Mood API: Validation passed');
    
    const { 
      mood_date, 
      mood_score, 
      energy_level, 
      stress_level, 
      motivation_level, 
      mood_tags, 
      notes, 
      triggers, 
      coping_strategies_used 
    } = validation.data;
    
    const id = uuidv4();
    
    await pool.query(`
      INSERT INTO mood_tracking (
        id, user_id, mood_date, mood_score, energy_level, stress_level, 
        motivation_level, mood_tags, notes, triggers, coping_strategies_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, mood_date, mood_score, energy_level, stress_level, motivation_level, mood_tags, notes, triggers, coping_strategies_used]);
    
    const result = await pool.query(
      'SELECT * FROM mood_tracking WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Mood entry already exists for this date' });
    }
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// PUT /api/mood/:date - Update mood entry
router.put('/:date', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    const validation = UpdateMoodEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
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
    
    updateValues.push(userId, date);
    
    const result = await pool.query(`
      UPDATE mood_tracking 
      SET ${updateFields.join(', ')}
      WHERE user_id = ? AND mood_date = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Mood entry not found for this date' });
    }
    
    const updated = await pool.query(
      'SELECT * FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, date]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating mood entry:', error);
    res.status(500).json({ error: 'Failed to update mood entry' });
  }
});

// DELETE /api/mood/:date - Delete mood entry
router.delete('/:date', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await pool.query(
      'DELETE FROM mood_tracking WHERE user_id = ? AND mood_date = ?',
      [userId, date]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Mood entry not found for this date' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

// GET /api/mood/intervention-triggers - Check for intervention triggers
router.get('/intervention-triggers', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '14')) || 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get recent mood data
    const moodData = await pool.query(`
      SELECT 
        mood_date,
        mood_score,
        energy_level,
        stress_level,
        motivation_level,
        notes,
        triggers
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      ORDER BY mood_date DESC
    `, [userId, startDateStr]);
    
    if (moodData.rows.length < 3) {
      return res.json({
        triggers: [],
        recommendations: [],
        analysis: "Not enough data for intervention analysis yet. Please log more mood entries."
      });
    }
    
    const triggers = await analyzeInterventionTriggers(moodData.rows);
    
    res.json(triggers);
  } catch (error) {
    console.error('Error checking intervention triggers:', error);
    res.status(500).json({ error: 'Failed to check intervention triggers' });
  }
});

// POST /api/mood/intervention-log - Log intervention action taken
router.post('/intervention-log', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { trigger_type, action_taken, notes, effectiveness } = req.body;
    
    const id = uuidv4();
    
    await pool.query(`
      INSERT INTO intervention_logs (
        id, user_id, trigger_type, action_taken, notes, effectiveness, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [id, userId, trigger_type, action_taken, notes, effectiveness]);
    
    res.status(201).json({ message: 'Intervention logged successfully' });
  } catch (error) {
    console.error('Error logging intervention:', error);
    res.status(500).json({ error: 'Failed to log intervention' });
  }
});

// Analyze intervention triggers
async function analyzeInterventionTriggers(moodData: any[]) {
  const triggers = [];
  const recommendations = [];
  
  // Sort data by date (oldest first)
  const sortedData = moodData.sort((a: any, b: any) => new Date(a.mood_date).getTime() - new Date(b.mood_date).getTime());
  
  // 1. Check for declining mood trend
  const moodScores = sortedData.map((entry: any) => entry.mood_score);
  const recentAvg = moodScores.slice(-3).reduce((sum: number, score: number) => sum + score, 0) / 3;
  const earlierAvg = moodScores.slice(0, 3).reduce((sum: number, score: number) => sum + score, 0) / 3;
  
  if (recentAvg < earlierAvg - 1.5) {
    triggers.push({
      type: 'declining_mood',
      severity: 'high',
      description: `Mood has declined from ${earlierAvg.toFixed(1)} to ${recentAvg.toFixed(1)} over the last ${moodData.length} days`,
      recommendation: 'Consider reaching out to a mental health professional or trusted friend'
    });
  }
  
  // 2. Check for consistently low mood
  const lowMoodDays = moodData.filter((entry: any) => entry.mood_score <= 4).length;
  const lowMoodPercentage = (lowMoodDays / moodData.length) * 100;
  
  if (lowMoodPercentage >= 50) {
    triggers.push({
      type: 'consistently_low_mood',
      severity: 'high',
      description: `${lowMoodPercentage.toFixed(0)}% of recent days have been low mood (4 or below)`,
      recommendation: 'This pattern suggests you may benefit from professional support or lifestyle changes'
    });
  }
  
  // 3. Check for high stress levels
  const stressLevels = sortedData.map((entry: any) => entry.stress_level || 0).filter((level: number) => level > 0);
  if (stressLevels.length > 0) {
    const avgStress = stressLevels.reduce((sum: number, level: number) => sum + level, 0) / stressLevels.length;
    const highStressDays = stressLevels.filter((level: number) => level >= 7).length;
    
    if (avgStress >= 7) {
      triggers.push({
        type: 'high_stress',
        severity: 'medium',
        description: `Average stress level is ${avgStress.toFixed(1)}/10 over recent days`,
        recommendation: 'Consider stress management techniques like meditation, exercise, or time management'
      });
    }
    
    if (highStressDays >= 3) {
      triggers.push({
        type: 'frequent_high_stress',
        severity: 'high',
        description: `${highStressDays} out of ${stressLevels.length} days had high stress levels (7+)`,
        recommendation: 'High stress frequency may indicate need for workload adjustment or stress management support'
      });
    }
  }
  
  // 4. Check for energy depletion
  const energyLevels = sortedData.map((entry: any) => entry.energy_level || 0).filter((level: number) => level > 0);
  if (energyLevels.length > 0) {
    const avgEnergy = energyLevels.reduce((sum: number, level: number) => sum + level, 0) / energyLevels.length;
    
    if (avgEnergy <= 4) {
      triggers.push({
        type: 'low_energy',
        severity: 'medium',
        description: `Average energy level is ${avgEnergy.toFixed(1)}/10 over recent days`,
        recommendation: 'Consider sleep hygiene, nutrition, and exercise to boost energy levels'
      });
    }
  }
  
  // 5. Check for motivation issues
  const motivationLevels = sortedData.map((entry: any) => entry.motivation_level || 0).filter((level: number) => level > 0);
  if (motivationLevels.length > 0) {
    const avgMotivation = motivationLevels.reduce((sum: number, level: number) => sum + level, 0) / motivationLevels.length;
    
    if (avgMotivation <= 4) {
      triggers.push({
        type: 'low_motivation',
        severity: 'medium',
        description: `Average motivation level is ${avgMotivation.toFixed(1)}/10 over recent days`,
        recommendation: 'Consider setting smaller, achievable goals or discussing workload with your manager'
      });
    }
  }
  
  // 6. Check for concerning patterns in notes/triggers
  const concerningKeywords = ['overwhelmed', 'burnout', 'exhausted', 'anxious', 'depressed', 'hopeless', 'stressed'];
  const concerningEntries = moodData.filter((entry: any) => {
    const text = `${entry.notes || ''} ${entry.triggers || ''}`.toLowerCase();
    return concerningKeywords.some(keyword => text.includes(keyword));
  });
  
  if (concerningEntries.length >= 2) {
    triggers.push({
      type: 'concerning_language',
      severity: 'high',
      description: `Found concerning language in ${concerningEntries.length} recent entries`,
      recommendation: 'Consider professional mental health support or discussing concerns with a trusted person'
    });
  }
  
  // Generate recommendations based on triggers
  if (triggers.length > 0) {
    recommendations.push({
      immediate: [
        'Take a break and practice deep breathing',
        'Reach out to a trusted friend or colleague',
        'Consider using coping strategies from your library'
      ],
      short_term: [
        'Review and adjust your workload if possible',
        'Schedule time for activities you enjoy',
        'Consider professional support if patterns persist'
      ],
      long_term: [
        'Develop a regular self-care routine',
        'Build a support network',
        'Consider lifestyle changes to improve overall wellbeing'
      ]
    });
  }
  
  return {
    triggers,
    recommendations,
    analysis: triggers.length > 0 
      ? `Found ${triggers.length} intervention trigger${triggers.length > 1 ? 's' : ''} that may need attention.`
      : 'No concerning patterns detected in recent mood data.',
    data_summary: {
      total_entries: moodData.length,
      avg_mood: moodScores.reduce((sum: number, score: number) => sum + score, 0) / moodScores.length,
      low_mood_percentage: lowMoodPercentage,
      avg_stress: stressLevels.length > 0 ? stressLevels.reduce((sum: number, level: number) => sum + level, 0) / stressLevels.length : 0,
      avg_energy: energyLevels.length > 0 ? energyLevels.reduce((sum: number, level: number) => sum + level, 0) / energyLevels.length : 0,
      avg_motivation: motivationLevels.length > 0 ? motivationLevels.reduce((sum: number, level: number) => sum + level, 0) / motivationLevels.length : 0
    }
  };
}

export default router;
