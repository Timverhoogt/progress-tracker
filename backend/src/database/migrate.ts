import { initializeDatabase } from './sqlite';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const db = initializeDatabase();

const createTables = async () => {
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

    // Create indexes for better performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);');

    // Insert sample data for Tim's ML terminal time project with UUID
    const projectId = uuidv4();
    await db.query(`
      INSERT OR IGNORE INTO projects (id, name, description, status) VALUES
      (?, 'ML Terminal Time Prediction - Terneuzen', 'Testing a machine learning model to predict ship terminal processing times at our Terneuzen facility. This project involves working with the customer service team and building monitoring dashboards.', 'active')
    `, [projectId]);

    console.log('✅ SQLite database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const main = async () => {
  await createTables();
  console.log('🚀 Database migration completed!');
};

if (require.main === module) {
  main().catch(console.error);
}

export { createTables };
