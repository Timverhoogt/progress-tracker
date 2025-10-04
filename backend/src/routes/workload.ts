import { Router } from 'express';
import { getDatabase } from '../database/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// Validation schemas
const WorkloadEntrySchema = z.object({
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  break_duration: z.number().int().min(0).optional(),
  intensity_level: z.number().int().min(1).max(10),
  focus_level: z.number().int().min(1).max(10).optional(),
  productivity_score: z.number().int().min(1).max(10).optional(),
  tasks_completed: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  work_type: z.string().optional(),
  location: z.string().optional()
});

const UpdateWorkloadEntrySchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  break_duration: z.number().int().min(0).optional(),
  intensity_level: z.number().int().min(1).max(10).optional(),
  focus_level: z.number().int().min(1).max(10).optional(),
  productivity_score: z.number().int().min(1).max(10).optional(),
  tasks_completed: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  work_type: z.string().optional(),
  location: z.string().optional()
});

// GET /api/workload - Get workload entries
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const limit = parseInt(String(req.query.limit || '30')) || 30;
    
    let query = 'SELECT * FROM workload_tracking WHERE user_id = ?';
    let params: any[] = [userId];
    
    if (startDate && endDate) {
      query += ' AND work_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND work_date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND work_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY work_date DESC LIMIT ?';
    params.push(limit);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workload entries:', error);
    res.status(500).json({ error: 'Failed to fetch workload entries' });
  }
});

// GET /api/workload/today - Get today's workload entry
router.get('/today', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(
      'SELECT * FROM workload_tracking WHERE user_id = ? AND work_date = ?',
      [userId, today]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching today\'s workload entry:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s workload entry' });
  }
});

// GET /api/workload/stats - Get workload statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(CAST((julianday(end_time) - julianday(start_time)) * 24 AS REAL)) as avg_work_hours,
        AVG(intensity_level) as avg_intensity,
        AVG(focus_level) as avg_focus,
        AVG(productivity_score) as avg_productivity,
        AVG(tasks_completed) as avg_tasks_completed,
        SUM(CAST((julianday(end_time) - julianday(start_time)) * 24 AS REAL)) as total_work_hours,
        COUNT(CASE WHEN intensity_level >= 8 THEN 1 END) as high_intensity_days,
        COUNT(CASE WHEN CAST((julianday(end_time) - julianday(start_time)) * 24 AS REAL) >= 10 THEN 1 END) as long_work_days
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
    `, [userId, startDateStr]);
    
    // Get weekly patterns
    const weeklyPatterns = await db.query(`
      SELECT 
        strftime('%Y-%W', work_date) as week,
        AVG(CAST((julianday(end_time) - julianday(start_time)) * 24 AS REAL)) as avg_hours,
        AVG(intensity_level) as avg_intensity,
        AVG(productivity_score) as avg_productivity,
        COUNT(*) as entries_count
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      GROUP BY strftime('%Y-%W', work_date)
      ORDER BY week
    `, [userId, startDateStr]);
    
    res.json({
      summary: result.rows[0],
      weekly_patterns: weeklyPatterns.rows
    });
  } catch (error) {
    console.error('Error fetching workload stats:', error);
    res.status(500).json({ error: 'Failed to fetch workload statistics' });
  }
});

// GET /api/workload/patterns - Get workload patterns and insights
router.get('/patterns', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '90')) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get day-of-week patterns
    const dayPatterns = await db.query(`
      SELECT 
        CASE strftime('%w', work_date)
          WHEN '0' THEN 'Sunday'
          WHEN '1' THEN 'Monday'
          WHEN '2' THEN 'Tuesday'
          WHEN '3' THEN 'Wednesday'
          WHEN '4' THEN 'Thursday'
          WHEN '5' THEN 'Friday'
          WHEN '6' THEN 'Saturday'
        END as day_of_week,
        AVG(CAST((julianday(end_time) - julianday(start_time)) * 24 AS REAL)) as avg_hours,
        AVG(intensity_level) as avg_intensity,
        AVG(productivity_score) as avg_productivity,
        COUNT(*) as count
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      GROUP BY strftime('%w', work_date)
      ORDER BY strftime('%w', work_date)
    `, [userId, startDateStr]);
    
    // Get work type patterns
    const workTypePatterns = await db.query(`
      SELECT 
        work_type,
        AVG(CAST((julianday(end_time) - julianday(start_time)) * 24 AS REAL)) as avg_hours,
        AVG(intensity_level) as avg_intensity,
        AVG(productivity_score) as avg_productivity,
        COUNT(*) as count
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ? AND work_type IS NOT NULL
      GROUP BY work_type
      ORDER BY count DESC
    `, [userId, startDateStr]);
    
    res.json({
      day_of_week_patterns: dayPatterns.rows,
      work_type_patterns: workTypePatterns.rows
    });
  } catch (error) {
    console.error('Error fetching workload patterns:', error);
    res.status(500).json({ error: 'Failed to fetch workload patterns' });
  }
});

// GET /api/workload/balance-analysis - Get work-life balance analysis
router.get('/balance-analysis', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get workload data
    const workloadData = await db.query(`
      SELECT 
        work_date,
        start_time,
        end_time,
        intensity_level,
        focus_level,
        productivity_score,
        tasks_completed,
        work_type,
        notes
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      ORDER BY work_date ASC
    `, [userId, startDateStr]);
    
    if (workloadData.rows.length === 0) {
      return res.json({
        analysis: "Not enough workload data for balance analysis yet. Please log more work sessions.",
        recommendations: [],
        balance_score: 0
      });
    }
    
    const analysis = await analyzeWorkLifeBalance(workloadData.rows);
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching balance analysis:', error);
    res.status(500).json({ error: 'Failed to fetch balance analysis' });
  }
});

// GET /api/workload/break-recommendations - Get personalized break recommendations
router.get('/break-recommendations', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '7')) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get recent workload data
    const workloadData = await db.query(`
      SELECT 
        work_date,
        start_time,
        end_time,
        break_duration,
        intensity_level,
        focus_level,
        productivity_score,
        tasks_completed,
        work_type,
        notes
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      ORDER BY work_date DESC
    `, [userId, startDateStr]);
    
    // Get work preferences
    const preferencesResult = await db.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    // Get recent mood data for context
    const moodData = await db.query(`
      SELECT 
        mood_date,
        mood_level,
        energy_level,
        stress_level,
        motivation_level,
        notes
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      ORDER BY mood_date DESC
    `, [userId, startDateStr]);
    
    if (workloadData.rows.length === 0) {
      return res.json({
        recommendations: [],
        analysis: "Not enough workload data for break recommendations yet. Please log more work sessions.",
        next_break_suggestion: null
      });
    }
    
    const recommendations = await generateBreakRecommendations(
      workloadData.rows, 
      preferencesResult.rows[0] || null,
      moodData.rows
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching break recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch break recommendations' });
  }
});

// GET /api/workload/balance-dashboard - Get comprehensive work-life balance dashboard
router.get('/balance-dashboard', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get workload data
    const workloadData = await db.query(`
      SELECT 
        work_date,
        start_time,
        end_time,
        break_duration,
        intensity_level,
        focus_level,
        productivity_score,
        tasks_completed,
        work_type,
        notes
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      ORDER BY work_date ASC
    `, [userId, startDateStr]);
    
    // Get mood data
    const moodData = await db.query(`
      SELECT 
        mood_date,
        mood_level,
        energy_level,
        stress_level,
        motivation_level,
        notes
      FROM mood_tracking 
      WHERE user_id = ? AND mood_date >= ?
      ORDER BY mood_date ASC
    `, [userId, startDateStr]);
    
    // Get work preferences
    const preferencesResult = await db.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    // Get coping strategies usage
    const copingData = await db.query(`
      SELECT 
        strategy_id,
        used_at,
        effectiveness_rating,
        stress_before,
        stress_after
      FROM coping_strategy_usage 
      WHERE user_id = ? AND used_at >= ?
      ORDER BY used_at DESC
    `, [userId, startDateStr]);
    
    if (workloadData.rows.length === 0) {
      return res.json({
        dashboard: {
          overview: "Not enough data for dashboard yet. Please log more work sessions and mood entries.",
          metrics: {},
          trends: {},
          recommendations: []
        }
      });
    }
    
    const dashboard = await generateBalanceDashboard(
      workloadData.rows,
      moodData.rows,
      copingData.rows,
      preferencesResult.rows[0] || null,
      days
    );
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching balance dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch balance dashboard' });
  }
});

// GET /api/workload/stress-alerts - Get stress alerts and warnings
router.get('/stress-alerts', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '7')) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get recent workload and mood data
    const [workloadData, moodData] = await Promise.all([
      db.query(`
        SELECT * FROM workload_tracking 
        WHERE user_id = ? AND work_date >= ?
        ORDER BY work_date DESC
      `, [userId, startDateStr]),
      db.query(`
        SELECT * FROM mood_tracking 
        WHERE user_id = ? AND mood_date >= ?
        ORDER BY mood_date DESC
      `, [userId, startDateStr])
    ]);
    
    // Calculate stress metrics
    const avgStress = moodData.rows.length > 0 ? 
      moodData.rows.reduce((sum, entry) => sum + (entry.stress_level || 0), 0) / moodData.rows.length : 5;
    const avgIntensity = workloadData.rows.length > 0 ?
      workloadData.rows.reduce((sum, entry) => sum + (entry.intensity_level || 0), 0) / workloadData.rows.length : 5;
    const avgWorkHours = workloadData.rows.length > 0 ?
      workloadData.rows.reduce((sum, entry) => {
        const start = new Date(`2000-01-01T${entry.start_time}:00`);
        const end = new Date(`2000-01-01T${entry.end_time}:00`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) - (entry.break_duration || 0) / 60;
        return sum + Math.max(0, hours);
      }, 0) / workloadData.rows.length : 8;
    const avgMood = moodData.rows.length > 0 ?
      moodData.rows.reduce((sum, entry) => sum + (entry.mood_level || 5), 0) / moodData.rows.length : 5;
    
    // Calculate risk score
    const riskScore = Math.min(10, Math.max(0, 
      (avgStress * 0.3) + 
      (avgIntensity * 0.25) + 
      ((avgWorkHours - 8) * 0.2) + 
      ((5 - avgMood) * 0.25)
    ));
    
    const riskLevel = riskScore > 7 ? 'high' : riskScore > 4 ? 'medium' : 'low';
    
    // Generate alerts
    const alerts = [];
    const warnings = [];
    
    if (avgStress > 7) {
      alerts.push({
        title: 'High Stress Level Detected',
        description: `Your average stress level is ${avgStress.toFixed(1)}/10 over the past ${days} days.`,
        severity: 'critical',
        actions: ['Take a break', 'Practice deep breathing', 'Consider workload reduction']
      });
    }
    
    if (avgIntensity > 8) {
      warnings.push({
        title: 'High Work Intensity',
        description: `Your work intensity is ${avgIntensity.toFixed(1)}/10. Consider pacing yourself.`,
        severity: 'warning',
        actions: ['Take regular breaks', 'Prioritize tasks', 'Delegate when possible']
      });
    }
    
    if (avgWorkHours > 9) {
      warnings.push({
        title: 'Long Work Hours',
        description: `You're averaging ${avgWorkHours.toFixed(1)} hours per day. Consider work-life balance.`,
        severity: 'warning',
        actions: ['Set work boundaries', 'Take time off', 'Optimize productivity']
      });
    }
    
    if (avgMood < 4) {
      alerts.push({
        title: 'Low Mood Detected',
        description: `Your average mood is ${avgMood.toFixed(1)}/10. Consider support.`,
        severity: 'critical',
        actions: ['Reach out to support network', 'Consider professional help', 'Practice self-care']
      });
    }
    
    res.json({
      alerts,
      warnings,
      risk_assessment: {
        stress_risk_score: Math.round(riskScore * 10) / 10,
        risk_level: riskLevel,
        factors: {
          stress_level: avgStress,
          work_intensity: avgIntensity,
          work_hours: avgWorkHours,
          mood_level: avgMood
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stress alerts:', error);
    res.status(500).json({ error: 'Failed to fetch stress alerts' });
  }
});

// POST /api/workload - Create new workload entry
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const validation = WorkloadEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const { 
      work_date, 
      start_time, 
      end_time, 
      break_duration, 
      intensity_level, 
      focus_level, 
      productivity_score, 
      tasks_completed, 
      notes, 
      work_type, 
      location 
    } = validation.data;
    
    const id = uuidv4();
    
    await db.query(`
      INSERT INTO workload_tracking (
        id, user_id, work_date, start_time, end_time, break_duration,
        intensity_level, focus_level, productivity_score, tasks_completed,
        notes, work_type, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, work_date, start_time, end_time, break_duration, intensity_level, focus_level, productivity_score, tasks_completed, notes, work_type, location]);
    
    const result = await db.query(
      'SELECT * FROM workload_tracking WHERE id = ?',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Workload entry already exists for this date' });
    }
    console.error('Error creating workload entry:', error);
    res.status(500).json({ error: 'Failed to create workload entry' });
  }
});

// PUT /api/workload/:date - Update workload entry
router.put('/:date', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    const validation = UpdateWorkloadEntrySchema.safeParse(req.body);
    
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
    
    const result = await db.query(`
      UPDATE workload_tracking 
      SET ${updateFields.join(', ')}
      WHERE user_id = ? AND work_date = ?
    `, updateValues);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Workload entry not found for this date' });
    }
    
    const updated = await db.query(
      'SELECT * FROM workload_tracking WHERE user_id = ? AND work_date = ?',
      [userId, date]
    );
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating workload entry:', error);
    res.status(500).json({ error: 'Failed to update workload entry' });
  }
});

// DELETE /api/workload/:date - Delete workload entry
router.delete('/:date', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.query.user_id || 'default';
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const result = await db.query(
      'DELETE FROM workload_tracking WHERE user_id = ? AND work_date = ?',
      [userId, date]
    );
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Workload entry not found for this date' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workload entry:', error);
    res.status(500).json({ error: 'Failed to delete workload entry' });
  }
});

// Analyze work-life balance
async function analyzeWorkLifeBalance(workloadData: any[]) {
  const recommendations = [];
  let balanceScore = 100; // Start with perfect balance
  
  // Calculate average work hours per day
  const workHours = workloadData.map((entry: any) => {
    const start = new Date(`2000-01-01T${entry.start_time}:00`);
    const end = new Date(`2000-01-01T${entry.end_time}:00`);
    const breakTime = entry.break_duration || 0;
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60) - breakTime;
  });
  
  const avgWorkHours = workHours.reduce((sum: number, hours: number) => sum + hours, 0) / workHours.length;
  const totalWorkHours = workHours.reduce((sum: number, hours: number) => sum + hours, 0);
  
  // Check for overwork
  if (avgWorkHours > 9) {
    balanceScore -= 30;
    recommendations.push({
      type: 'overwork',
      severity: 'high',
      title: 'Excessive Work Hours',
      description: `Average work hours: ${avgWorkHours.toFixed(1)} hours per day`,
      recommendation: 'Consider reducing work hours and taking more breaks to prevent burnout'
    });
  } else if (avgWorkHours > 8) {
    balanceScore -= 15;
    recommendations.push({
      type: 'overwork',
      severity: 'medium',
      title: 'Long Work Hours',
      description: `Average work hours: ${avgWorkHours.toFixed(1)} hours per day`,
      recommendation: 'Monitor your work hours and ensure you have adequate rest time'
    });
  }
  
  // Check for weekend work
  const weekendWork = workloadData.filter((entry: any) => {
    const date = new Date(entry.work_date);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  });
  
  if (weekendWork.length > workloadData.length * 0.3) {
    balanceScore -= 20;
    recommendations.push({
      type: 'weekend_work',
      severity: 'medium',
      title: 'Frequent Weekend Work',
      description: `${weekendWork.length} out of ${workloadData.length} days were weekends`,
      recommendation: 'Try to limit weekend work and ensure you have proper rest days'
    });
  }
  
  // Check for high intensity work
  const avgIntensity = workloadData.reduce((sum: number, entry: any) => sum + (entry.intensity_level || 0), 0) / workloadData.length;
  if (avgIntensity > 8) {
    balanceScore -= 15;
    recommendations.push({
      type: 'high_intensity',
      severity: 'medium',
      title: 'High Work Intensity',
      description: `Average intensity level: ${avgIntensity.toFixed(1)}/10`,
      recommendation: 'Consider reducing work intensity and incorporating more low-intensity tasks'
    });
  }
  
  // Check for productivity vs hours correlation
  const productivityScores = workloadData.map((entry: any) => entry.productivity_score || 0).filter((score: number) => score > 0);
  if (productivityScores.length > 0) {
    const avgProductivity = productivityScores.reduce((sum: number, score: number) => sum + score, 0) / productivityScores.length;
    const productivityEfficiency = avgProductivity / avgWorkHours;
    
    if (productivityEfficiency < 0.8) {
      balanceScore -= 10;
      recommendations.push({
        type: 'productivity',
        severity: 'low',
        title: 'Productivity Efficiency',
        description: `Productivity efficiency: ${productivityEfficiency.toFixed(2)} points per hour`,
        recommendation: 'Consider optimizing your work schedule for better productivity'
      });
    }
  }
  
  // Generate positive recommendations
  if (balanceScore >= 80) {
    recommendations.push({
      type: 'positive',
      severity: 'low',
      title: 'Good Work-Life Balance',
      description: 'Your work patterns show good balance',
      recommendation: 'Keep up the good work! Continue monitoring your workload to maintain this balance'
    });
  }
  
  return {
    analysis: balanceScore >= 80 
      ? 'Your work-life balance looks healthy overall.'
      : balanceScore >= 60 
      ? 'Your work-life balance needs some attention.'
      : 'Your work-life balance requires immediate attention.',
    recommendations,
    balance_score: Math.max(0, balanceScore),
    metrics: {
      avg_work_hours: avgWorkHours,
      total_work_hours: totalWorkHours,
      weekend_work_days: weekendWork.length,
      avg_intensity: avgIntensity,
      avg_productivity: productivityScores.length > 0 ? productivityScores.reduce((sum: number, score: number) => sum + score, 0) / productivityScores.length : 0
    }
  };
}

// Generate personalized break recommendations
async function generateBreakRecommendations(workloadData: any[], preferences: any, moodData: any[]) {
  const recommendations: any[] = [];
  const analysis: any = {};
  
  // Calculate current work session metrics
  const currentDate = new Date().toISOString().split('T')[0];
  const todayWorkload = workloadData.find(entry => entry.work_date === currentDate);
  
  // Calculate work hours for each day
  const dailyMetrics = workloadData.map(entry => {
    const start = new Date(`2000-01-01T${entry.start_time}:00`);
    const end = new Date(`2000-01-01T${entry.end_time}:00`);
    const breakTime = entry.break_duration || 0;
    const workHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) - breakTime;
    
    return {
      date: entry.work_date,
      workHours,
      breakDuration: entry.break_duration || 0,
      intensity: entry.intensity_level,
      focus: entry.focus_level,
      productivity: entry.productivity_score,
      workType: entry.work_type
    };
  });
  
  // Calculate averages
  const avgWorkHours = dailyMetrics.reduce((sum, day) => sum + day.workHours, 0) / dailyMetrics.length;
  const avgBreakDuration = dailyMetrics.reduce((sum, day) => sum + day.breakDuration, 0) / dailyMetrics.length;
  const avgIntensity = dailyMetrics.reduce((sum, day) => sum + day.intensity, 0) / dailyMetrics.length;
  const avgFocus = dailyMetrics.reduce((sum, day) => sum + (day.focus || 0), 0) / dailyMetrics.length;
  const avgProductivity = dailyMetrics.reduce((sum, day) => sum + (day.productivity || 0), 0) / dailyMetrics.length;
  
  // Get recent mood context
  const recentMood = moodData.length > 0 ? moodData[0] : null;
  const avgStress = moodData.length > 0 ? 
    moodData.reduce((sum, mood) => sum + mood.stress_level, 0) / moodData.length : 5;
  const avgEnergy = moodData.length > 0 ? 
    moodData.reduce((sum, mood) => sum + mood.energy_level, 0) / moodData.length : 5;
  
  // Break frequency analysis
  const breakFrequency = avgBreakDuration / avgWorkHours; // breaks per hour
  const recommendedBreakFrequency = 0.15; // 15% of work time should be breaks
  
  // 1. Break Frequency Recommendations
  if (breakFrequency < recommendedBreakFrequency) {
    const severity = breakFrequency < 0.05 ? 'high' : 'medium';
    recommendations.push({
      type: 'break_frequency',
      priority: severity,
      title: 'Increase Break Frequency',
      description: `You're taking breaks for only ${(breakFrequency * 100).toFixed(1)}% of your work time. Recommended: 15%`,
      suggestion: 'Take a 5-10 minute break every 50-60 minutes of focused work',
      timing: 'Every 50-60 minutes',
      duration: '5-10 minutes',
      activities: ['Walk around', 'Stretch', 'Deep breathing', 'Look away from screen']
    });
  }
  
  // 2. Intensity-based break recommendations
  if (avgIntensity > 7) {
    recommendations.push({
      type: 'high_intensity_breaks',
      priority: 'high',
      title: 'High-Intensity Work Recovery',
      description: `Your average work intensity is ${avgIntensity.toFixed(1)}/10. High-intensity work requires more frequent breaks.`,
      suggestion: 'Take longer, more restorative breaks after intense work sessions',
      timing: 'After every 2-3 hours of high-intensity work',
      duration: '15-20 minutes',
      activities: ['Meditation', 'Light exercise', 'Nature walk', 'Mindful breathing', 'Gentle stretching']
    });
  }
  
  // 3. Stress-based recommendations
  if (avgStress > 6) {
    recommendations.push({
      type: 'stress_relief_breaks',
      priority: 'high',
      title: 'Stress Relief Breaks',
      description: `Your average stress level is ${avgStress.toFixed(1)}/10. Regular stress-relief breaks are essential.`,
      suggestion: 'Incorporate stress-relief activities into your break routine',
      timing: 'Every 45-60 minutes when stressed',
      duration: '10-15 minutes',
      activities: ['Progressive muscle relaxation', 'Guided meditation', 'Deep breathing exercises', 'Gentle yoga', 'Listening to calming music']
    });
  }
  
  // 4. Energy-based recommendations
  if (avgEnergy < 5) {
    recommendations.push({
      type: 'energy_boost_breaks',
      priority: 'medium',
      title: 'Energy Boost Breaks',
      description: `Your average energy level is ${avgEnergy.toFixed(1)}/10. Energizing breaks can help maintain productivity.`,
      suggestion: 'Take energizing breaks to boost your energy levels',
      timing: 'When you feel energy dropping',
      duration: '5-10 minutes',
      activities: ['Quick walk', 'Jumping jacks', 'Cold water on face', 'Bright light exposure', 'Protein snack']
    });
  }
  
  // 5. Focus-based recommendations
  if (avgFocus < 6) {
    recommendations.push({
      type: 'focus_restoration_breaks',
      priority: 'medium',
      title: 'Focus Restoration Breaks',
      description: `Your average focus level is ${avgFocus.toFixed(1)}/10. Regular breaks help restore mental focus.`,
      suggestion: 'Take breaks specifically designed to restore mental focus',
      timing: 'Every 45-60 minutes',
      duration: '5-10 minutes',
      activities: ['Eye exercises', 'Focus on distant objects', 'Mindful observation', 'Simple puzzles', 'Fresh air']
    });
  }
  
  // 6. Work type specific recommendations
  const workTypes = dailyMetrics.map(day => day.workType).filter(Boolean);
  const mostCommonWorkType = workTypes.length > 0 ? 
    workTypes.sort((a, b) => workTypes.filter(v => v === a).length - workTypes.filter(v => v === b).length).pop() : null;
  
  if (mostCommonWorkType) {
    if (mostCommonWorkType.toLowerCase().includes('meeting') || mostCommonWorkType.toLowerCase().includes('call')) {
      recommendations.push({
        type: 'meeting_recovery_breaks',
        priority: 'medium',
        title: 'Meeting Recovery Breaks',
        description: 'You frequently have meeting-heavy days. Meetings can be mentally draining.',
        suggestion: 'Take recovery breaks after back-to-back meetings',
        timing: 'After 2-3 consecutive meetings',
        duration: '10-15 minutes',
        activities: ['Silent time', 'Note review', 'Deep breathing', 'Light stretching', 'Hydration']
      });
    }
    
    if (mostCommonWorkType.toLowerCase().includes('coding') || mostCommonWorkType.toLowerCase().includes('development')) {
      recommendations.push({
        type: 'coding_breaks',
        priority: 'medium',
        title: 'Coding Break Strategy',
        description: 'You do a lot of coding work. The 20-20-20 rule is especially important for developers.',
        suggestion: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds',
        timing: 'Every 20 minutes during coding',
        duration: '20 seconds to 2 minutes',
        activities: ['Look at distant objects', 'Eye exercises', 'Stand up and stretch', 'Walk around desk']
      });
    }
  }
  
  // 7. Time-based recommendations
  const currentHour = new Date().getHours();
  if (currentHour >= 14 && currentHour <= 16) {
    recommendations.push({
      type: 'afternoon_energy_dip',
      priority: 'medium',
      title: 'Afternoon Energy Dip Break',
      description: 'You\'re in the typical afternoon energy dip period (2-4 PM). A strategic break can boost productivity.',
      suggestion: 'Take a power break to combat the afternoon slump',
      timing: 'Now (2-4 PM)',
      duration: '10-15 minutes',
      activities: ['Light snack', 'Short walk', 'Fresh air', 'Caffeine (if appropriate)', 'Bright light']
    });
  }
  
  // 8. Next break suggestion based on current session
  let nextBreakSuggestion = null;
  if (todayWorkload) {
    const startTime = new Date(`2000-01-01T${todayWorkload.start_time}:00`);
    const currentTime = new Date();
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);
    const currentTimeObj = new Date(`2000-01-01T${currentTimeStr}:00`);
    const workDuration = (currentTimeObj.getTime() - startTime.getTime()) / (1000 * 60); // minutes
    
    if (workDuration > 60 && workDuration % 60 < 15) { // More than 1 hour and within 15 minutes of next hour
      nextBreakSuggestion = {
        message: 'You\'ve been working for over an hour. Consider taking a break soon.',
        urgency: workDuration > 90 ? 'high' : 'medium',
        suggested_activities: ['Walk around', 'Stretch', 'Hydrate', 'Eye rest']
      };
    }
  }
  
  // Generate analysis summary
  analysis.break_frequency = breakFrequency;
  analysis.recommended_break_frequency = recommendedBreakFrequency;
  analysis.avg_work_hours = avgWorkHours;
  analysis.avg_break_duration = avgBreakDuration;
  analysis.avg_intensity = avgIntensity;
  analysis.avg_stress = avgStress;
  analysis.avg_energy = avgEnergy;
  analysis.avg_focus = avgFocus;
  analysis.work_patterns = {
    most_common_work_type: mostCommonWorkType,
    high_intensity_days: dailyMetrics.filter(day => day.intensity > 7).length,
    long_work_days: dailyMetrics.filter(day => day.workHours > 8).length
  };
  
  return {
    recommendations,
    analysis,
    next_break_suggestion: nextBreakSuggestion,
    summary: `Based on your recent work patterns, I recommend ${recommendations.length} break strategies to optimize your productivity and wellbeing.`
  };
}

// Generate comprehensive work-life balance dashboard
async function generateBalanceDashboard(workloadData: any[], moodData: any[], copingData: any[], preferences: any, days: number) {
  // Calculate daily metrics
  const dailyMetrics = workloadData.map(entry => {
    const start = new Date(`2000-01-01T${entry.start_time}:00`);
    const end = new Date(`2000-01-01T${entry.end_time}:00`);
    const breakTime = entry.break_duration || 0;
    const workHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) - breakTime;
    
    return {
      date: entry.work_date,
      workHours,
      breakDuration: entry.break_duration || 0,
      intensity: entry.intensity_level,
      focus: entry.focus_level,
      productivity: entry.productivity_score,
      tasksCompleted: entry.tasks_completed,
      workType: entry.work_type
    };
  });
  
  // Calculate mood metrics
  const moodMetrics = moodData.map(entry => ({
    date: entry.mood_date,
    mood: entry.mood_level,
    energy: entry.energy_level,
    stress: entry.stress_level,
    motivation: entry.motivation_level
  }));
  
  // Calculate averages
  const avgWorkHours = dailyMetrics.reduce((sum, day) => sum + day.workHours, 0) / dailyMetrics.length;
  const avgBreakDuration = dailyMetrics.reduce((sum, day) => sum + day.breakDuration, 0) / dailyMetrics.length;
  const avgIntensity = dailyMetrics.reduce((sum, day) => sum + day.intensity, 0) / dailyMetrics.length;
  const avgFocus = dailyMetrics.reduce((sum, day) => sum + (day.focus || 0), 0) / dailyMetrics.length;
  const avgProductivity = dailyMetrics.reduce((sum, day) => sum + (day.productivity || 0), 0) / dailyMetrics.length;
  const avgTasksCompleted = dailyMetrics.reduce((sum, day) => sum + (day.tasksCompleted || 0), 0) / dailyMetrics.length;
  
  // Calculate mood averages
  const avgMood = moodMetrics.length > 0 ? 
    moodMetrics.reduce((sum, mood) => sum + mood.mood, 0) / moodMetrics.length : 5;
  const avgEnergy = moodMetrics.length > 0 ? 
    moodMetrics.reduce((sum, mood) => sum + mood.energy, 0) / moodMetrics.length : 5;
  const avgStress = moodMetrics.length > 0 ? 
    moodMetrics.reduce((sum, mood) => sum + mood.stress, 0) / moodMetrics.length : 5;
  const avgMotivation = moodMetrics.length > 0 ? 
    moodMetrics.reduce((sum, mood) => sum + mood.motivation, 0) / moodMetrics.length : 5;
  
  // Calculate trends (comparing first half vs second half of period)
  const midPoint = Math.floor(dailyMetrics.length / 2);
  const firstHalf = dailyMetrics.slice(0, midPoint);
  const secondHalf = dailyMetrics.slice(midPoint);
  
  const firstHalfAvgHours = firstHalf.length > 0 ? 
    firstHalf.reduce((sum, day) => sum + day.workHours, 0) / firstHalf.length : 0;
  const secondHalfAvgHours = secondHalf.length > 0 ? 
    secondHalf.reduce((sum, day) => sum + day.workHours, 0) / secondHalf.length : 0;
  
  const workHoursTrend = secondHalfAvgHours > firstHalfAvgHours ? 'increasing' : 
    secondHalfAvgHours < firstHalfAvgHours ? 'decreasing' : 'stable';
  
  // Calculate work-life balance score
  let balanceScore = 100;
  if (avgWorkHours > 9) balanceScore -= 30;
  else if (avgWorkHours > 8) balanceScore -= 15;
  
  if (avgStress > 7) balanceScore -= 25;
  else if (avgStress > 6) balanceScore -= 15;
  
  if (avgIntensity > 8) balanceScore -= 20;
  else if (avgIntensity > 7) balanceScore -= 10;
  
  if (avgMood < 4) balanceScore -= 20;
  else if (avgMood < 5) balanceScore -= 10;
  
  if (avgEnergy < 4) balanceScore -= 15;
  else if (avgEnergy < 5) balanceScore -= 5;
  
  balanceScore = Math.max(0, balanceScore);
  
  // Calculate work type distribution
  const workTypes = dailyMetrics.map(day => day.workType).filter(Boolean);
  const workTypeDistribution = workTypes.reduce((acc: any, type: string) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate day-of-week patterns
  const dayPatterns = dailyMetrics.reduce((acc: any, day) => {
    const date = new Date(day.date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = { workHours: 0, intensity: 0, count: 0 };
    }
    acc[dayOfWeek].workHours += day.workHours;
    acc[dayOfWeek].intensity += day.intensity;
    acc[dayOfWeek].count += 1;
    return acc;
  }, {});
  
  // Calculate average per day of week
  Object.keys(dayPatterns).forEach(day => {
    if (dayPatterns[day].count > 0) {
      dayPatterns[day].avgHours = dayPatterns[day].workHours / dayPatterns[day].count;
      dayPatterns[day].avgIntensity = dayPatterns[day].intensity / dayPatterns[day].count;
    }
  });
  
  // Calculate coping strategy effectiveness
  const copingEffectiveness = copingData.reduce((acc: any, usage: any) => {
    if (!acc[usage.strategy_id]) {
      acc[usage.strategy_id] = { totalRating: 0, count: 0, stressReduction: 0 };
    }
    acc[usage.strategy_id].totalRating += usage.effectiveness_rating || 0;
    acc[usage.strategy_id].count += 1;
    if (usage.stress_before && usage.stress_after) {
      acc[usage.strategy_id].stressReduction += (usage.stress_before - usage.stress_after);
    }
    return acc;
  }, {});
  
  // Calculate average effectiveness per strategy
  Object.keys(copingEffectiveness).forEach(strategyId => {
    const strategy = copingEffectiveness[strategyId];
    strategy.avgEffectiveness = strategy.totalRating / strategy.count;
    strategy.avgStressReduction = strategy.stressReduction / strategy.count;
  });
  
  // Generate recommendations
  const recommendations = [];
  
  if (balanceScore < 60) {
    recommendations.push({
      type: 'critical',
      title: 'Work-Life Balance Needs Immediate Attention',
      description: `Your balance score is ${balanceScore}/100. Focus on reducing work hours and stress levels.`,
      actions: [
        'Reduce daily work hours',
        'Take more frequent breaks',
        'Practice stress-relief techniques',
        'Consider delegating tasks'
      ]
    });
  } else if (balanceScore < 80) {
    recommendations.push({
      type: 'warning',
      title: 'Work-Life Balance Needs Improvement',
      description: `Your balance score is ${balanceScore}/100. Small adjustments can improve your wellbeing.`,
      actions: [
        'Monitor work hours more closely',
        'Increase break frequency',
        'Practice mindfulness',
        'Set clearer boundaries'
      ]
    });
  } else {
    recommendations.push({
      type: 'positive',
      title: 'Good Work-Life Balance',
      description: `Your balance score is ${balanceScore}/100. Keep up the good work!`,
      actions: [
        'Continue current practices',
        'Monitor for any changes',
        'Share strategies with others',
        'Maintain consistency'
      ]
    });
  }
  
  if (avgStress > 6) {
    recommendations.push({
      type: 'stress',
      title: 'High Stress Levels Detected',
      description: `Average stress level: ${avgStress.toFixed(1)}/10`,
      actions: [
        'Use coping strategies more frequently',
        'Take stress-relief breaks',
        'Consider workload reduction',
        'Practice relaxation techniques'
      ]
    });
  }
  
  if (avgWorkHours > 8) {
    recommendations.push({
      type: 'overwork',
      title: 'Long Work Hours Pattern',
      description: `Average work hours: ${avgWorkHours.toFixed(1)} hours per day`,
      actions: [
        'Set daily hour limits',
        'Take more breaks',
        'Delegate tasks',
        'Improve time management'
      ]
    });
  }
  
  // Generate insights
  const insights = [];
  
  if (workHoursTrend === 'increasing') {
    insights.push({
      type: 'trend',
      title: 'Work Hours Increasing',
      description: 'Your work hours have been increasing over time. Monitor for burnout risk.',
      impact: 'negative'
    });
  }
  
  if (avgProductivity < 5 && avgWorkHours > 7) {
    insights.push({
      type: 'efficiency',
      title: 'Low Productivity Despite Long Hours',
      description: 'Consider optimizing your work schedule for better efficiency.',
      impact: 'neutral'
    });
  }
  
  if (Object.keys(copingEffectiveness).length > 0) {
    const mostEffectiveStrategy = Object.keys(copingEffectiveness).reduce((a, b) => 
      copingEffectiveness[a].avgEffectiveness > copingEffectiveness[b].avgEffectiveness ? a : b
    );
    insights.push({
      type: 'coping',
      title: 'Most Effective Coping Strategy',
      description: `Strategy ${mostEffectiveStrategy} has the highest effectiveness rating.`,
      impact: 'positive'
    });
  }
  
  return {
    dashboard: {
      overview: {
        balance_score: balanceScore,
        period_days: days,
        data_quality: workloadData.length > 0 && moodData.length > 0 ? 'good' : 'limited'
      },
      metrics: {
        work: {
          avg_daily_hours: avgWorkHours,
          avg_break_duration: avgBreakDuration,
          avg_intensity: avgIntensity,
          avg_focus: avgFocus,
          avg_productivity: avgProductivity,
          avg_tasks_completed: avgTasksCompleted,
          total_work_days: dailyMetrics.length
        },
        wellbeing: {
          avg_mood: avgMood,
          avg_energy: avgEnergy,
          avg_stress: avgStress,
          avg_motivation: avgMotivation,
          total_mood_entries: moodMetrics.length
        },
        trends: {
          work_hours_trend: workHoursTrend,
          work_hours_change: ((secondHalfAvgHours - firstHalfAvgHours) / firstHalfAvgHours * 100).toFixed(1) + '%'
        }
      },
      patterns: {
        work_type_distribution: workTypeDistribution,
        day_of_week_patterns: dayPatterns,
        coping_strategy_effectiveness: copingEffectiveness
      },
      recommendations,
      insights,
      summary: `Your work-life balance score is ${balanceScore}/100. ${balanceScore >= 80 ? 'Excellent balance!' : balanceScore >= 60 ? 'Good balance with room for improvement.' : 'Needs attention to prevent burnout.'}`
    }
  };
}

export default router;
