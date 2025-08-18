import { initializeDatabase } from './sqlite';
import crypto from 'crypto';

const db = initializeDatabase();

const createAITables = async () => {
  try {
    console.log('🧠 Creating AI-powered personal development tables...');

    // User Preferences Table - Store coaching preferences, styles, thresholds
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        preference_category TEXT NOT NULL,
        preference_key TEXT NOT NULL,
        preference_value TEXT NOT NULL,
        preference_type TEXT DEFAULT 'string',
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, preference_category, preference_key)
      );
    `);

    // Skills Assessment Table - User skills, competency levels, assessment history
    await db.query(`
      CREATE TABLE IF NOT EXISTS skills_assessment (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        skill_name TEXT NOT NULL,
        skill_category TEXT NOT NULL,
        current_level INTEGER DEFAULT 1,
        target_level INTEGER DEFAULT 5,
        self_assessment_score INTEGER,
        ai_assessment_score INTEGER,
        assessment_notes TEXT,
        last_assessed_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, skill_name, skill_category)
      );
    `);

    // Achievements Table - User-defined and system achievements
    await db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        achievement_name TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        description TEXT,
        criteria TEXT,
        target_value REAL,
        current_value REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        completion_date TEXT,
        celebration_message TEXT,
        is_system_generated INTEGER DEFAULT 0,
        priority_level TEXT DEFAULT 'medium',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Mood Tracking Table - Daily mood logs, patterns, triggers
    await db.query(`
      CREATE TABLE IF NOT EXISTS mood_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        mood_date TEXT NOT NULL,
        mood_score INTEGER NOT NULL,
        energy_level INTEGER,
        stress_level INTEGER,
        motivation_level INTEGER,
        mood_tags TEXT,
        notes TEXT,
        triggers TEXT,
        coping_strategies_used TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, mood_date)
      );
    `);

    // Learning Paths Table - Personalized learning recommendations and progress
    await db.query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        path_name TEXT NOT NULL,
        path_description TEXT,
        skill_focus TEXT NOT NULL,
        difficulty_level TEXT DEFAULT 'beginner',
        estimated_duration_hours INTEGER,
        progress_percentage REAL DEFAULT 0,
        status TEXT DEFAULT 'not_started',
        ai_generated INTEGER DEFAULT 0,
        custom_resources TEXT,
        completion_criteria TEXT,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Coaching Sessions Table - Historical coaching interactions and outcomes
    await db.query(`
      CREATE TABLE IF NOT EXISTS coaching_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        session_type TEXT NOT NULL,
        session_topic TEXT,
        user_message TEXT,
        ai_response TEXT,
        coaching_style TEXT DEFAULT 'supportive',
        mood_context TEXT,
        session_outcome TEXT,
        user_feedback_rating INTEGER,
        user_feedback_notes TEXT,
        context_data TEXT,
        session_duration_seconds INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Best Practices Library Table - User's extracted lessons and insights
    await db.query(`
      CREATE TABLE IF NOT EXISTS best_practices (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        practice_title TEXT NOT NULL,
        practice_description TEXT NOT NULL,
        practice_category TEXT NOT NULL,
        situation_context TEXT,
        lessons_learned TEXT,
        success_metrics TEXT,
        related_projects TEXT,
        tags TEXT,
        effectiveness_rating INTEGER,
        usage_count INTEGER DEFAULT 0,
        last_used_at TEXT,
        is_ai_extracted INTEGER DEFAULT 0,
        source_note_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Reflection Templates Table - Customizable reflection prompts and responses
    await db.query(`
      CREATE TABLE IF NOT EXISTS reflection_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        template_name TEXT NOT NULL,
        template_type TEXT NOT NULL,
        frequency TEXT DEFAULT 'weekly',
        prompt_questions TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        last_used_at TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Reflection Responses Table - Store user responses to reflection templates
    await db.query(`
      CREATE TABLE IF NOT EXISTS reflection_responses (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        template_id TEXT REFERENCES reflection_templates(id) ON DELETE CASCADE,
        reflection_date TEXT NOT NULL,
        responses TEXT NOT NULL,
        mood_at_reflection INTEGER,
        insights_extracted TEXT,
        action_items_generated TEXT,
        ai_analysis TEXT,
        time_spent_minutes INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Work-Life Balance Metrics Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS work_life_metrics (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        metric_date TEXT NOT NULL,
        work_hours REAL,
        break_time_minutes INTEGER,
        after_hours_work_minutes INTEGER,
        weekend_work_minutes INTEGER,
        stress_incidents INTEGER DEFAULT 0,
        balance_rating INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, metric_date)
      );
    `);

    // Create indexes for better performance
    console.log('📊 Creating indexes for AI tables...');
    
    // User preferences indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON user_preferences(user_id, preference_category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(user_id, preference_key);');
    
    // Skills assessment indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_skills_assessment_user ON skills_assessment(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_skills_assessment_category ON skills_assessment(user_id, skill_category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_skills_last_assessed ON skills_assessment(last_assessed_at DESC);');
    
    // Achievements indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_achievements_status ON achievements(user_id, status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(user_id, achievement_type);');
    
    // Mood tracking indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_mood_tracking_user ON mood_tracking(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_mood_tracking_date ON mood_tracking(user_id, mood_date DESC);');
    
    // Learning paths indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths(user_id, status);');
    
    // Coaching sessions indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user ON coaching_sessions(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coaching_sessions_type ON coaching_sessions(user_id, session_type);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coaching_sessions_date ON coaching_sessions(created_at DESC);');
    
    // Best practices indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_best_practices_user ON best_practices(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_best_practices_category ON best_practices(user_id, practice_category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_best_practices_tags ON best_practices(tags);');
    
    // Reflection templates indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_reflection_templates_user ON reflection_templates(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reflection_templates_active ON reflection_templates(user_id, is_active);');
    
    // Reflection responses indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_reflection_responses_user ON reflection_responses(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reflection_responses_template ON reflection_responses(template_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reflection_responses_date ON reflection_responses(reflection_date DESC);');
    
    // Work-life balance indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_work_life_metrics_user ON work_life_metrics(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_work_life_metrics_date ON work_life_metrics(user_id, metric_date DESC);');

    // Insert default preferences
    console.log('⚙️ Inserting default user preferences...');
    const defaultPreferences = [
      // Coaching Style Preferences
      ['coaching', 'personality', 'supportive', 'string', 'AI coaching personality: supportive, challenging, analytical'],
      ['coaching', 'communication_frequency', 'moderate', 'string', 'Frequency of AI coaching interactions: low, moderate, high'],
      ['coaching', 'detail_level', 'balanced', 'string', 'Level of coaching detail: brief, balanced, detailed, comprehensive'],
      ['coaching', 'focus_areas', 'skills,wellbeing', 'string', 'Primary coaching focus areas (comma-separated)'],
      
      // Notification Preferences
      ['notifications', 'mood_check_reminder', 'true', 'boolean', 'Enable daily mood check-in reminders'],
      ['notifications', 'reflection_reminders', 'true', 'boolean', 'Enable reflection prompt reminders'],
      ['notifications', 'achievement_celebrations', 'true', 'boolean', 'Enable achievement celebration notifications'],
      ['notifications', 'learning_suggestions', 'true', 'boolean', 'Enable AI learning path suggestions'],
      
      // Wellbeing Preferences
      ['wellbeing', 'stress_threshold', '7', 'integer', 'Stress level threshold for AI intervention (1-10)'],
      ['wellbeing', 'work_hours_target', '8', 'integer', 'Target daily work hours'],
      ['wellbeing', 'break_frequency_minutes', '90', 'integer', 'Recommended break frequency in minutes'],
      ['wellbeing', 'weekend_work_alerts', 'true', 'boolean', 'Alert when working on weekends'],
      
      // Learning Preferences
      ['learning', 'preferred_learning_style', 'balanced', 'string', 'Preferred learning style: visual, auditory, kinesthetic, reading, balanced'],
      ['learning', 'challenge_level', 'moderate', 'string', 'Preferred challenge level: easy, moderate, challenging'],
      ['learning', 'learning_time_preference', 'morning', 'string', 'Preferred time for learning: morning, afternoon, evening, flexible'],
      
      // Privacy Preferences
      ['privacy', 'data_sharing_level', 'minimal', 'string', 'Level of data sharing for AI: minimal, standard, comprehensive'],
      ['privacy', 'coaching_history_retention', '365', 'integer', 'Days to retain coaching session history'],
      
      // Achievement Preferences
      ['achievements', 'celebration_style', 'encouraging', 'string', 'Style of achievement celebrations: subtle, encouraging, enthusiastic'],
      ['achievements', 'auto_suggest_goals', 'true', 'boolean', 'Allow AI to suggest new achievement goals'],
      ['achievements', 'public_achievements', 'false', 'boolean', 'Make achievements visible in reports']
    ];

    for (const [category, key, value, type, description] of defaultPreferences) {
      await db.query(`
        INSERT OR IGNORE INTO user_preferences (id, user_id, preference_category, preference_key, preference_value, preference_type, description)
        VALUES (?, 'default', ?, ?, ?, ?, ?)
      `, [crypto.randomUUID(), category, key, value, type, description]);
    }

    // Insert default reflection templates
    console.log('📝 Inserting default reflection templates...');
    const defaultTemplates = [
      {
        name: 'Daily Check-in',
        type: 'daily',
        frequency: 'daily',
        questions: JSON.stringify([
          'How am I feeling about today\'s progress?',
          'What was my biggest win today?',
          'What challenged me the most today?',
          'What did I learn today?',
          'How can I improve tomorrow?'
        ]),
        isDefault: 1
      },
      {
        name: 'Weekly Reflection',
        type: 'weekly',
        frequency: 'weekly',
        questions: JSON.stringify([
          'What were my key accomplishments this week?',
          'What patterns do I notice in my work and mood?',
          'What skills did I develop or practice this week?',
          'What would I do differently next week?',
          'What am I grateful for this week?',
          'What are my priorities for next week?'
        ]),
        isDefault: 1
      },
      {
        name: 'Project Retrospective',
        type: 'project',
        frequency: 'as_needed',
        questions: JSON.stringify([
          'What went well in this project phase?',
          'What could have been improved?',
          'What did I learn about myself during this project?',
          'What new skills did I develop?',
          'How did I handle challenges and setbacks?',
          'What would I do differently in a similar project?',
          'What best practices can I extract from this experience?'
        ]),
        isDefault: 1
      },
      {
        name: 'Skills Assessment',
        type: 'skills',
        frequency: 'monthly',
        questions: JSON.stringify([
          'Which skills have I improved this month?',
          'Where do I still feel I need development?',
          'What new skills do I want to focus on?',
          'How confident do I feel in my key competencies?',
          'What learning opportunities should I pursue?'
        ]),
        isDefault: 1
      }
    ];

    for (const template of defaultTemplates) {
      await db.query(`
        INSERT OR IGNORE INTO reflection_templates (id, user_id, template_name, template_type, frequency, prompt_questions, is_active, is_default)
        VALUES (?, 'default', ?, ?, ?, ?, 1, ?)
      `, [crypto.randomUUID(), template.name, template.type, template.frequency, template.questions, template.isDefault]);
    }

    console.log('✅ AI-powered personal development tables created successfully!');
    console.log('🎯 Phase 1.1: Database Schema Extensions - COMPLETED');
    
  } catch (error) {
    console.error('❌ Error creating AI tables:', error);
    throw error;
  }
};

const main = async () => {
  await createAITables();
  console.log('🚀 AI features database migration completed!');
};

if (require.main === module) {
  main().catch(console.error);
}

export { createAITables };
