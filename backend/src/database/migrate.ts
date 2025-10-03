import { initializeDatabase, getDatabase } from './sqlite';
import { v4 as uuidv4 } from 'uuid';
import { createAITables } from './migrate-ai-features';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  const db = getDatabase();
  try {
    // Projects table (SQLite compatible)
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Notes table (diary-style entries) - SQLite compatible
    await db.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        enhanced_content TEXT,
        structured_data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Todos table - SQLite compatible
    await db.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        llm_generated INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Reports table - SQLite compatible
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        report_type TEXT NOT NULL,
        recipient TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Milestones table for timelines - SQLite compatible
    await db.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        target_date TEXT,
        status TEXT DEFAULT 'planned',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Settings table for dynamic configuration
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'string',
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Create indexes for better performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(target_date);');

    // Check if any projects exist before inserting sample data
    const existingProjects = await db.query('SELECT COUNT(*) as count FROM projects');
    
    // Only insert sample data if no projects exist (fresh installation)
    if (existingProjects.rows[0].count === 0) {
      const projectId = uuidv4();
      await db.query(`
        INSERT INTO projects (id, name, description, status) VALUES
        (?, 'ML Terminal Time Prediction - Terneuzen', 'Testing a machine learning model to predict ship terminal processing times at our Terneuzen facility. This project involves working with the customer service team and building monitoring dashboards.', 'active')
      `, [projectId]);
      console.log('✅ Sample project inserted');
    } else {
      console.log('ℹ️ Projects already exist, skipping sample data insertion');
    }

    // Insert default settings
    const defaultSettings = [
      ['weekly_report_email', process.env.DEFAULT_REPORT_EMAIL || '', 'string', 'Email address for weekly reports'],
      ['weekly_reports_enabled', 'true', 'boolean', 'Enable/disable automatic weekly reports'],
      ['weekly_report_schedule', '0 9 * * 1', 'string', 'Cron schedule for weekly reports (default: Monday 9 AM)'],
      ['sendgrid_from_email', process.env.SENDGRID_FROM_EMAIL || 'progress@evosgpt.eu', 'string', 'From email address for SendGrid'],
      ['timezone', process.env.TIMEZONE || 'Europe/Amsterdam', 'string', 'Timezone for scheduling'],
      ['llm_system_prompt_mode', 'generated', 'string', 'System prompt mode: generated or custom']
    ];

    for (const [key, value, type, description] of defaultSettings) {
      await db.query(`
        INSERT OR IGNORE INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)
      `, [key, value, type, description]);
    }

    console.log('✅ SQLite database tables created successfully!');

    // Create AI-powered personal development tables
    await createAITables();
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const main = async () => {
  await createTables();
  await createAITables();
  console.log('🚀 Database migration completed!');
};

if (require.main === module) {
  main().catch(console.error);
}

export { createTables };
