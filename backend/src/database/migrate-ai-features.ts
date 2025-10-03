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
        mood_level INTEGER NOT NULL,
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

    // Coping strategies library table
    await db.query(`
      CREATE TABLE IF NOT EXISTS coping_strategies (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        strategy_name TEXT NOT NULL,
        strategy_category TEXT NOT NULL,
        description TEXT NOT NULL,
        instructions TEXT NOT NULL,
        duration_minutes INTEGER,
        difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
        effectiveness_rating REAL DEFAULT 0.0,
        usage_count INTEGER DEFAULT 0,
        last_used TEXT,
        is_personalized BOOLEAN DEFAULT 0,
        mood_tags TEXT,
        stress_levels TEXT,
        triggers TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Coping strategy usage tracking table
    await db.query(`
      CREATE TABLE IF NOT EXISTS coping_strategy_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        strategy_id TEXT NOT NULL,
        used_at TEXT NOT NULL,
        mood_before INTEGER,
        mood_after INTEGER,
        stress_before INTEGER,
        stress_after INTEGER,
        effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
        notes TEXT,
        context TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (strategy_id) REFERENCES coping_strategies(id)
      );
    `);

    // Intervention logs table - Track when intervention triggers are activated and actions taken
    await db.query(`
      CREATE TABLE IF NOT EXISTS intervention_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        trigger_type TEXT NOT NULL,
        action_taken TEXT,
        notes TEXT,
        effectiveness INTEGER CHECK (effectiveness >= 1 AND effectiveness <= 5),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Workload tracking table - Track work hours, intensity, and productivity
    await db.query(`
      CREATE TABLE IF NOT EXISTS workload_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        work_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        break_duration INTEGER DEFAULT 0,
        intensity_level INTEGER NOT NULL CHECK (intensity_level >= 1 AND intensity_level <= 10),
        focus_level INTEGER CHECK (focus_level >= 1 AND focus_level <= 10),
        productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
        tasks_completed INTEGER DEFAULT 0,
        notes TEXT,
        work_type TEXT,
        location TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, work_date)
      );
    `);

    // Work preferences and boundary settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS work_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        max_daily_hours REAL DEFAULT 8.0,
        max_weekly_hours REAL DEFAULT 40.0,
        preferred_start_time TEXT DEFAULT '09:00',
        preferred_end_time TEXT DEFAULT '17:00',
        break_duration_minutes INTEGER DEFAULT 60,
        max_intensity_level INTEGER DEFAULT 8,
        stress_threshold INTEGER DEFAULT 7,
        weekend_work_allowed BOOLEAN DEFAULT 0,
        max_weekend_hours REAL DEFAULT 4.0,
        overtime_threshold_hours REAL DEFAULT 2.0,
        break_reminder_interval INTEGER DEFAULT 90,
        work_life_balance_goal TEXT DEFAULT 'balanced',
        notification_preferences TEXT DEFAULT '{"email": true, "browser": true, "mobile": false}',
        auto_break_suggestions BOOLEAN DEFAULT 1,
        intensity_warnings BOOLEAN DEFAULT 1,
        overwork_alerts BOOLEAN DEFAULT 1,
        weekly_summary BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id)
      );
    `);

    // Gratitude Entries Table - Store gratitude practice entries and prompts
    await db.query(`
      CREATE TABLE IF NOT EXISTS gratitude_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT 'default',
        gratitude_date TEXT NOT NULL,
        category TEXT,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        mood_before INTEGER,
        mood_after INTEGER,
        achievement_id TEXT,
        tags TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (achievement_id) REFERENCES achievements(id)
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
    
    // Coping strategies indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_strategies_user ON coping_strategies(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_strategies_category ON coping_strategies(user_id, strategy_category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_strategies_active ON coping_strategies(user_id, is_active);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_strategies_effectiveness ON coping_strategies(user_id, effectiveness_rating DESC);');
    
    // Coping strategy usage indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_usage_user ON coping_strategy_usage(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_usage_strategy ON coping_strategy_usage(strategy_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_coping_usage_date ON coping_strategy_usage(user_id, used_at DESC);');
    
    // Intervention logs indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_intervention_logs_user ON intervention_logs(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_intervention_logs_trigger ON intervention_logs(user_id, trigger_type);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_intervention_logs_date ON intervention_logs(created_at DESC);');
    
    // Workload tracking indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_workload_tracking_user ON workload_tracking(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_workload_tracking_date ON workload_tracking(user_id, work_date DESC);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_workload_tracking_type ON workload_tracking(user_id, work_type);');
    
    // Work preferences indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_work_preferences_user ON work_preferences(user_id);');
    
    // Gratitude entries indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user ON gratitude_entries(user_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON gratitude_entries(user_id, gratitude_date DESC);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_gratitude_entries_category ON gratitude_entries(user_id, category);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_gratitude_entries_achievement ON gratitude_entries(achievement_id);');

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

    // Insert default coping strategies
    console.log('🧘 Inserting default coping strategies...');
    const defaultStrategies = [
      {
        name: 'Deep Breathing Exercise',
        category: 'breathing',
        description: 'A simple 4-7-8 breathing technique to quickly reduce stress and anxiety',
        instructions: 'Inhale for 4 counts, hold for 7 counts, exhale for 8 counts. Repeat 4 times.',
        duration: 2,
        difficulty: 1,
        mood_tags: 'anxious,stressed,overwhelmed',
        stress_levels: '6,7,8,9,10',
        triggers: 'work pressure,deadlines,meetings'
      },
      {
        name: 'Progressive Muscle Relaxation',
        category: 'physical',
        description: 'Systematically tense and relax muscle groups to release physical tension',
        instructions: 'Start with your toes, tense for 5 seconds, then relax. Work your way up through each muscle group to your head.',
        duration: 10,
        difficulty: 2,
        mood_tags: 'tense,stressed,anxious',
        stress_levels: '5,6,7,8,9',
        triggers: 'physical tension,stress,anxiety'
      },
      {
        name: 'Mindful Walking',
        category: 'mindfulness',
        description: 'A short mindful walk to reset and refocus your mind',
        instructions: 'Walk slowly and deliberately, focusing on each step and your breathing. Notice your surroundings without judgment.',
        duration: 5,
        difficulty: 1,
        mood_tags: 'restless,stressed,unfocused',
        stress_levels: '4,5,6,7,8',
        triggers: 'mental fatigue,concentration issues'
      },
      {
        name: 'Gratitude Journaling',
        category: 'cognitive',
        description: 'Write down three things you are grateful for to shift perspective',
        instructions: 'Take 2 minutes to write down three specific things you are grateful for today. Be detailed and specific.',
        duration: 3,
        difficulty: 1,
        mood_tags: 'negative,down,stressed',
        stress_levels: '3,4,5,6,7',
        triggers: 'negative thinking,low mood'
      },
      {
        name: 'Quick Body Scan',
        category: 'mindfulness',
        description: 'A brief body scan to check in with physical sensations and release tension',
        instructions: 'Close your eyes and mentally scan your body from head to toe. Notice any tension and consciously release it.',
        duration: 3,
        difficulty: 1,
        mood_tags: 'tense,stressed,unfocused',
        stress_levels: '4,5,6,7,8',
        triggers: 'physical tension,stress'
      },
      {
        name: 'Positive Affirmations',
        category: 'cognitive',
        description: 'Repeat positive statements to boost confidence and shift mindset',
        instructions: 'Choose 2-3 positive statements about your abilities and repeat them with conviction for 1-2 minutes.',
        duration: 2,
        difficulty: 1,
        mood_tags: 'doubtful,low confidence,stressed',
        stress_levels: '4,5,6,7,8',
        triggers: 'self-doubt,low confidence'
      },
      {
        name: 'Quick Meditation',
        category: 'mindfulness',
        description: 'A brief meditation to center yourself and find calm',
        instructions: 'Sit comfortably, close your eyes, and focus on your breath. When your mind wanders, gently return to your breath.',
        duration: 5,
        difficulty: 2,
        mood_tags: 'anxious,stressed,overwhelmed',
        stress_levels: '5,6,7,8,9',
        triggers: 'anxiety,overwhelm,stress'
      },
      {
        name: 'Task Prioritization',
        category: 'cognitive',
        description: 'Organize and prioritize tasks to reduce overwhelm and increase focus',
        instructions: 'List all current tasks, then categorize them by urgency and importance. Focus on the most critical 2-3 tasks.',
        duration: 5,
        difficulty: 2,
        mood_tags: 'overwhelmed,stressed,unfocused',
        stress_levels: '6,7,8,9,10',
        triggers: 'work overload,deadlines,multiple tasks'
      }
    ];

    for (const strategy of defaultStrategies) {
      await db.query(`
        INSERT OR IGNORE INTO coping_strategies (
          id, user_id, strategy_name, strategy_category, description, instructions,
          duration_minutes, difficulty_level, mood_tags, stress_levels, triggers,
          is_personalized, is_active
        ) VALUES (?, 'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
      `, [
        crypto.randomUUID(),
        strategy.name,
        strategy.category,
        strategy.description,
        strategy.instructions,
        strategy.duration,
        strategy.difficulty,
        strategy.mood_tags,
        strategy.stress_levels,
        strategy.triggers
      ]);
    }

    // Insert default work preferences
    console.log('⚙️ Inserting default work preferences...');
    await db.query(`
      INSERT OR IGNORE INTO work_preferences (
        id, user_id, max_daily_hours, max_weekly_hours, preferred_start_time, preferred_end_time,
        break_duration_minutes, max_intensity_level, stress_threshold, weekend_work_allowed,
        max_weekend_hours, overtime_threshold_hours, break_reminder_interval, work_life_balance_goal,
        notification_preferences, auto_break_suggestions, intensity_warnings, overwork_alerts, weekly_summary
      ) VALUES (?, 'default', 8.0, 40.0, '09:00', '17:00', 60, 8, 7, 0, 4.0, 2.0, 90, 'balanced', 
                '{"email": true, "browser": true, "mobile": false}', 1, 1, 1, 1)
    `, [crypto.randomUUID()]);

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
