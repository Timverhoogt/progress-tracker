import { Router } from 'express';
import { pool } from '../server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// Validation schemas
const WorkPreferencesSchema = z.object({
  max_daily_hours: z.number().min(1).max(24).optional(),
  max_weekly_hours: z.number().min(1).max(168).optional(),
  preferred_start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  preferred_end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  break_duration_minutes: z.number().int().min(0).max(480).optional(),
  max_intensity_level: z.number().int().min(1).max(10).optional(),
  stress_threshold: z.number().int().min(1).max(10).optional(),
  weekend_work_allowed: z.boolean().optional(),
  max_weekend_hours: z.number().min(0).max(48).optional(),
  overtime_threshold_hours: z.number().min(0).max(12).optional(),
  break_reminder_interval: z.number().int().min(15).max(240).optional(),
  work_life_balance_goal: z.enum(['work_focused', 'balanced', 'life_focused']).optional(),
  notification_preferences: z.string().optional(),
  auto_break_suggestions: z.boolean().optional(),
  intensity_warnings: z.boolean().optional(),
  overwork_alerts: z.boolean().optional(),
  weekly_summary: z.boolean().optional()
});

// GET /api/work-preferences - Get user's work preferences
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    
    const result = await pool.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences if none exist
      const id = uuidv4();
      await pool.query(`
        INSERT INTO work_preferences (
          id, user_id, max_daily_hours, max_weekly_hours, preferred_start_time, preferred_end_time,
          break_duration_minutes, max_intensity_level, stress_threshold, weekend_work_allowed,
          max_weekend_hours, overtime_threshold_hours, break_reminder_interval, work_life_balance_goal,
          notification_preferences, auto_break_suggestions, intensity_warnings, overwork_alerts, weekly_summary
        ) VALUES (?, ?, 8.0, 40.0, '09:00', '17:00', 60, 8, 7, 0, 4.0, 2.0, 90, 'balanced', 
                  '{"email": true, "browser": true, "mobile": false}', 1, 1, 1, 1)
      `, [id, userId]);
      
      const newResult = await pool.query(
        'SELECT * FROM work_preferences WHERE user_id = ?',
        [userId]
      );
      
      return res.json(newResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching work preferences:', error);
    res.status(500).json({ error: 'Failed to fetch work preferences' });
  }
});

// PUT /api/work-preferences - Update user's work preferences
router.put('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const validation = WorkPreferencesSchema.safeParse(req.body);
    
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
    
    updateValues.push(userId);
    
    // Check if preferences exist
    const existing = await pool.query(
      'SELECT id FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (existing.rows.length === 0) {
      // Create new preferences
      const id = uuidv4();
      const allFields = ['id', 'user_id', ...Object.keys(updateData)];
      const allValues = [id, userId, ...Object.values(updateData)];
      
      await pool.query(`
        INSERT INTO work_preferences (${allFields.join(', ')})
        VALUES (${allFields.map(() => '?').join(', ')})
      `, allValues);
    } else {
      // Update existing preferences
      await pool.query(`
        UPDATE work_preferences 
        SET ${updateFields.join(', ')}, updated_at = datetime('now')
        WHERE user_id = ?
      `, updateValues);
    }
    
    // Return updated preferences
    const result = await pool.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating work preferences:', error);
    res.status(500).json({ error: 'Failed to update work preferences' });
  }
});

// GET /api/work-preferences/boundaries - Get work boundary analysis
router.get('/boundaries', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '30')) || 30;
    
    // Get user preferences
    const preferencesResult = await pool.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work preferences not found' });
    }
    
    const preferences = preferencesResult.rows[0];
    
    // Get recent workload data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const workloadResult = await pool.query(`
      SELECT 
        work_date,
        start_time,
        end_time,
        break_duration,
        intensity_level,
        focus_level,
        productivity_score,
        work_type
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      ORDER BY work_date DESC
    `, [userId, startDateStr]);
    
    const workloadData = workloadResult.rows;
    
    // Analyze boundary violations
    const violations: any[] = [];
    let totalViolations = 0;
    
    // Calculate work hours for each day
    const dailyHours = workloadData.map(entry => {
      const start = new Date(`2000-01-01T${entry.start_time}:00`);
      const end = new Date(`2000-01-01T${entry.end_time}:00`);
      const breakTime = entry.break_duration || 0;
      const workHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) - breakTime;
      
      return {
        date: entry.work_date,
        hours: workHours,
        intensity: entry.intensity_level,
        workType: entry.work_type
      };
    });
    
    // Check daily hour violations
    dailyHours.forEach(day => {
      if (day.hours > preferences.max_daily_hours) {
        violations.push({
          type: 'daily_hours_exceeded',
          date: day.date,
          actual: day.hours,
          limit: preferences.max_daily_hours,
          severity: day.hours > preferences.max_daily_hours * 1.5 ? 'high' : 'medium'
        });
        totalViolations++;
      }
    });
    
    // Check intensity violations
    dailyHours.forEach(day => {
      if (day.intensity > preferences.max_intensity_level) {
        violations.push({
          type: 'intensity_exceeded',
          date: day.date,
          actual: day.intensity,
          limit: preferences.max_intensity_level,
          severity: day.intensity > preferences.max_intensity_level + 2 ? 'high' : 'medium'
        });
        totalViolations++;
      }
    });
    
    // Check weekend work violations
    if (!preferences.weekend_work_allowed) {
      const weekendWork = dailyHours.filter(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
      });
      
      weekendWork.forEach(day => {
        violations.push({
          type: 'weekend_work',
          date: day.date,
          actual: day.hours,
          limit: 0,
          severity: day.hours > 2 ? 'high' : 'medium'
        });
        totalViolations++;
      });
    }
    
    // Calculate weekly hours
    const weeklyHours: { [key: string]: number } = {};
    dailyHours.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyHours[weekKey]) {
        weeklyHours[weekKey] = 0;
      }
      weeklyHours[weekKey] += day.hours;
    });
    
    // Check weekly hour violations
    Object.entries(weeklyHours).forEach(([week, hours]) => {
      if (hours > preferences.max_weekly_hours) {
        violations.push({
          type: 'weekly_hours_exceeded',
          date: week,
          actual: hours,
          limit: preferences.max_weekly_hours,
          severity: hours > preferences.max_weekly_hours * 1.2 ? 'high' : 'medium'
        });
        totalViolations++;
      }
    });
    
    // Generate recommendations
    const recommendations: any[] = [];
    
    if (totalViolations > 0) {
      recommendations.push({
        type: 'boundary_violations',
        title: 'Work Boundary Violations Detected',
        description: `Found ${totalViolations} boundary violations in the last ${days} days`,
        priority: 'high',
        actions: [
          'Review and adjust your work preferences',
          'Set up automated alerts for boundary violations',
          'Consider delegating tasks to reduce workload'
        ]
      });
    }
    
    if (violations.some(v => v.type === 'daily_hours_exceeded')) {
      recommendations.push({
        type: 'daily_hours',
        title: 'Daily Work Hours Management',
        description: 'Consider breaking up long work days into smaller, focused sessions',
        priority: 'medium',
        actions: [
          'Set a maximum daily work hour limit',
          'Schedule regular breaks throughout the day',
          'Use time-blocking techniques for better focus'
        ]
      });
    }
    
    if (violations.some(v => v.type === 'intensity_exceeded')) {
      recommendations.push({
        type: 'intensity_management',
        title: 'Work Intensity Management',
        description: 'High-intensity work periods should be balanced with lighter tasks',
        priority: 'medium',
        actions: [
          'Mix high-intensity tasks with administrative work',
          'Schedule recovery time between intense work sessions',
          'Consider the 80/20 rule for work intensity'
        ]
      });
    }
    
    // Calculate compliance score
    const totalDays = dailyHours.length;
    const violationDays = new Set(violations.map(v => v.date)).size;
    const complianceScore = totalDays > 0 ? Math.max(0, 100 - (violationDays / totalDays) * 100) : 100;
    
    res.json({
      preferences,
      violations,
      total_violations: totalViolations,
      compliance_score: Math.round(complianceScore),
      recommendations,
      analysis: {
        total_days_analyzed: totalDays,
        violation_days: violationDays,
        avg_daily_hours: dailyHours.length > 0 ? 
          (dailyHours.reduce((sum, day) => sum + day.hours, 0) / dailyHours.length).toFixed(1) : 0,
        avg_intensity: dailyHours.length > 0 ? 
          (dailyHours.reduce((sum, day) => sum + day.intensity, 0) / dailyHours.length).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error analyzing work boundaries:', error);
    res.status(500).json({ error: 'Failed to analyze work boundaries' });
  }
});

// POST /api/work-preferences/reset - Reset to default preferences
router.post('/reset', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    
    await pool.query(
      'DELETE FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    const id = uuidv4();
    await pool.query(`
      INSERT INTO work_preferences (
        id, user_id, max_daily_hours, max_weekly_hours, preferred_start_time, preferred_end_time,
        break_duration_minutes, max_intensity_level, stress_threshold, weekend_work_allowed,
        max_weekend_hours, overtime_threshold_hours, break_reminder_interval, work_life_balance_goal,
        notification_preferences, auto_break_suggestions, intensity_warnings, overwork_alerts, weekly_summary
      ) VALUES (?, ?, 8.0, 40.0, '09:00', '17:00', 60, 8, 7, 0, 4.0, 2.0, 90, 'balanced', 
                '{"email": true, "browser": true, "mobile": false}', 1, 1, 1, 1)
    `, [id, userId]);
    
    const result = await pool.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resetting work preferences:', error);
    res.status(500).json({ error: 'Failed to reset work preferences' });
  }
});

// GET /api/work-preferences/stress-alerts - Get stress threshold alerts and warnings
router.get('/stress-alerts', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const days = parseInt(String(req.query.days || '7')) || 7;
    
    // Get user preferences
    const preferencesResult = await pool.query(
      'SELECT * FROM work_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work preferences not found' });
    }
    
    const preferences = preferencesResult.rows[0];
    
    // Get recent workload data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const workloadResult = await pool.query(`
      SELECT 
        work_date,
        start_time,
        end_time,
        break_duration,
        intensity_level,
        focus_level,
        productivity_score,
        work_type,
        notes
      FROM workload_tracking 
      WHERE user_id = ? AND work_date >= ?
      ORDER BY work_date DESC
    `, [userId, startDateStr]);
    
    // Get recent mood data
    const moodResult = await pool.query(`
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
    
    const alerts = await generateStressAlerts(
      workloadResult.rows, 
      moodResult.rows, 
      preferences
    );
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching stress alerts:', error);
    res.status(500).json({ error: 'Failed to fetch stress alerts' });
  }
});

// Generate stress threshold alerts and warnings
async function generateStressAlerts(workloadData: any[], moodData: any[], preferences: any) {
  const alerts: any[] = [];
  const warnings: any[] = [];
  
  // Calculate current metrics
  const currentDate = new Date().toISOString().split('T')[0];
  const todayWorkload = workloadData.find(entry => entry.work_date === currentDate);
  const todayMood = moodData.find(entry => entry.mood_date === currentDate);
  
  // Calculate work hours for each day
  const dailyMetrics = workloadData.map(entry => {
    const start = new Date(`2000-01-01T${entry.start_time}:00`);
    const end = new Date(`2000-01-01T${entry.end_time}:00`);
    const breakTime = entry.break_duration || 0;
    const workHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) - breakTime;
    
    return {
      date: entry.work_date,
      workHours,
      intensity: entry.intensity_level,
      focus: entry.focus_level,
      productivity: entry.productivity_score,
      workType: entry.work_type
    };
  });
  
  // Calculate averages
  const avgWorkHours = dailyMetrics.reduce((sum, day) => sum + day.workHours, 0) / dailyMetrics.length;
  const avgIntensity = dailyMetrics.reduce((sum, day) => sum + day.intensity, 0) / dailyMetrics.length;
  const avgProductivity = dailyMetrics.reduce((sum, day) => sum + (day.productivity || 0), 0) / dailyMetrics.length;
  
  // Calculate mood averages
  const avgStress = moodData.length > 0 ? 
    moodData.reduce((sum, mood) => sum + mood.stress_level, 0) / moodData.length : 5;
  const avgMood = moodData.length > 0 ? 
    moodData.reduce((sum, mood) => sum + mood.mood_level, 0) / moodData.length : 5;
  const avgEnergy = moodData.length > 0 ? 
    moodData.reduce((sum, mood) => sum + mood.energy_level, 0) / moodData.length : 5;
  
  // 1. Stress Level Alerts
  if (avgStress > preferences.stress_threshold) {
    const severity = avgStress > preferences.stress_threshold + 2 ? 'critical' : 'high';
    alerts.push({
      type: 'stress_threshold_exceeded',
      severity,
      title: 'High Stress Level Detected',
      description: `Your average stress level is ${avgStress.toFixed(1)}/10, exceeding your threshold of ${preferences.stress_threshold}/10`,
      recommendation: 'Consider taking immediate stress-relief measures',
      actions: [
        'Take a 15-minute break',
        'Practice deep breathing exercises',
        'Go for a short walk',
        'Consider reducing work intensity',
        'Use coping strategies from your library'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 2. Work Intensity Alerts
  if (avgIntensity > preferences.max_intensity_level) {
    const severity = avgIntensity > preferences.max_intensity_level + 2 ? 'high' : 'medium';
    alerts.push({
      type: 'intensity_threshold_exceeded',
      severity,
      title: 'High Work Intensity Detected',
      description: `Your average work intensity is ${avgIntensity.toFixed(1)}/10, exceeding your preferred maximum of ${preferences.max_intensity_level}/10`,
      recommendation: 'Consider balancing high-intensity work with lighter tasks',
      actions: [
        'Schedule breaks between intense work sessions',
        'Mix high-intensity tasks with administrative work',
        'Consider delegating some tasks',
        'Use the 80/20 rule for work intensity'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 3. Overwork Alerts
  if (avgWorkHours > preferences.max_daily_hours) {
    const severity = avgWorkHours > preferences.max_daily_hours * 1.5 ? 'critical' : 'high';
    alerts.push({
      type: 'overwork_detected',
      severity,
      title: 'Overwork Pattern Detected',
      description: `Your average daily work hours (${avgWorkHours.toFixed(1)}) exceed your preferred maximum (${preferences.max_daily_hours})`,
      recommendation: 'Reduce work hours to prevent burnout',
      actions: [
        'Set strict work hour boundaries',
        'Delegate tasks to reduce workload',
        'Take regular breaks throughout the day',
        'Consider time-blocking techniques',
        'Review and prioritize tasks'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 4. Productivity Decline Warnings
  if (avgProductivity < 5 && avgWorkHours > 6) {
    warnings.push({
      type: 'productivity_decline',
      severity: 'medium',
      title: 'Productivity Decline Warning',
      description: `Your productivity score (${avgProductivity.toFixed(1)}/10) is low despite working ${avgWorkHours.toFixed(1)} hours per day`,
      recommendation: 'Consider optimizing your work schedule and taking more breaks',
      actions: [
        'Take more frequent breaks',
        'Review your work environment',
        'Consider your energy levels throughout the day',
        'Eliminate distractions',
        'Focus on high-priority tasks first'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 5. Mood Decline Warnings
  if (avgMood < 4 && avgStress > 6) {
    warnings.push({
      type: 'mood_decline',
      severity: 'high',
      title: 'Mood and Stress Warning',
      description: `Your mood (${avgMood.toFixed(1)}/10) and stress (${avgStress.toFixed(1)}/10) levels indicate potential burnout risk`,
      recommendation: 'Take immediate action to improve your wellbeing',
      actions: [
        'Take a mental health day if possible',
        'Practice stress-relief techniques',
        'Engage in activities you enjoy',
        'Consider speaking with a professional',
        'Review your work-life balance'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 6. Energy Depletion Warnings
  if (avgEnergy < 4 && avgWorkHours > 7) {
    warnings.push({
      type: 'energy_depletion',
      severity: 'medium',
      title: 'Energy Depletion Warning',
      description: `Your energy level (${avgEnergy.toFixed(1)}/10) is low despite working ${avgWorkHours.toFixed(1)} hours per day`,
      recommendation: 'Focus on energy management and recovery',
      actions: [
        'Ensure adequate sleep (7-9 hours)',
        'Take energizing breaks',
        'Stay hydrated and eat nutritious meals',
        'Consider your work schedule timing',
        'Reduce work intensity when energy is low'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 7. Consecutive High-Stress Days
  const consecutiveHighStressDays = moodData.filter((mood, index) => {
    if (index === 0) return mood.stress_level > preferences.stress_threshold;
    const prevMood = moodData[index - 1];
    const currentDate = new Date(mood.mood_date);
    const prevDate = new Date(prevMood.mood_date);
    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    return dayDiff === 1 && mood.stress_level > preferences.stress_threshold;
  }).length;
  
  if (consecutiveHighStressDays >= 3) {
    alerts.push({
      type: 'consecutive_high_stress',
      severity: 'high',
      title: 'Consecutive High-Stress Days',
      description: `You've had ${consecutiveHighStressDays} consecutive days with stress levels above your threshold`,
      recommendation: 'Take immediate action to break the stress cycle',
      actions: [
        'Take a day off if possible',
        'Implement daily stress-relief routines',
        'Review and adjust your workload',
        'Practice mindfulness and meditation',
        'Consider professional support'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  // 8. Weekend Work Violations
  if (!preferences.weekend_work_allowed) {
    const weekendWork = dailyMetrics.filter(day => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    });
    
    if (weekendWork.length > 0) {
      warnings.push({
        type: 'weekend_work_violation',
        severity: 'medium',
        title: 'Weekend Work Detected',
        description: `You worked on ${weekendWork.length} weekend days, but your preferences don't allow weekend work`,
        recommendation: 'Respect your work-life balance boundaries',
        actions: [
          'Plan work to avoid weekends',
          'Set clear work boundaries',
          'Use weekends for rest and recovery',
          'Delegate urgent weekend tasks if possible'
        ],
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Calculate overall stress risk score
  let stressRiskScore = 0;
  if (avgStress > preferences.stress_threshold) stressRiskScore += 30;
  if (avgIntensity > preferences.max_intensity_level) stressRiskScore += 20;
  if (avgWorkHours > preferences.max_daily_hours) stressRiskScore += 25;
  if (avgMood < 4) stressRiskScore += 15;
  if (avgEnergy < 4) stressRiskScore += 10;
  if (consecutiveHighStressDays >= 3) stressRiskScore += 20;
  
  const riskLevel = stressRiskScore >= 70 ? 'high' : stressRiskScore >= 40 ? 'medium' : 'low';
  
  return {
    alerts,
    warnings,
    risk_assessment: {
      stress_risk_score: Math.min(100, stressRiskScore),
      risk_level: riskLevel,
      factors: {
        stress_level: avgStress,
        work_intensity: avgIntensity,
        work_hours: avgWorkHours,
        mood_level: avgMood,
        energy_level: avgEnergy,
        consecutive_high_stress_days: consecutiveHighStressDays
      }
    },
    recommendations: {
      immediate_actions: alerts.length > 0 ? alerts.slice(0, 2).map(alert => alert.actions[0]) : [],
      preventive_measures: [
        'Set up regular break reminders',
        'Monitor your stress levels daily',
        'Practice stress-relief techniques',
        'Maintain work-life balance boundaries',
        'Get adequate sleep and nutrition'
      ]
    },
    summary: `Found ${alerts.length} critical alerts and ${warnings.length} warnings. Your stress risk level is ${riskLevel}.`
  };
}

export default router;
