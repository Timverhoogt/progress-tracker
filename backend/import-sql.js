const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'progress_tracker_clean.db');
const sqlPath = path.join(__dirname, '..', 'database_export.sql');

console.log('Reading SQL export...');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('Creating new database...');
const db = new Database(dbPath);

// Set journal mode to DELETE to avoid WAL
db.pragma('journal_mode = DELETE');

console.log('Executing SQL import...');
try {
  db.exec(sql);
  console.log('✅ Database imported successfully!');

  // Verify data
  const projects = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  const notes = db.prepare('SELECT COUNT(*) as count FROM notes').get();
  const todos = db.prepare('SELECT COUNT(*) as count FROM todos').get();

  console.log(`\nData verification:`);
  console.log(`  Projects: ${projects.count}`);
  console.log(`  Notes: ${notes.count}`);
  console.log(`  Todos: ${todos.count}`);

} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
