import { initializeDatabase } from "./src/database/sqlite";
import path from "path";

const dbPath = path.join(__dirname, "data", "progress_tracker.db");
const db = initializeDatabase(dbPath);

async function checkDatabase() {
  try {
    console.log("=== Database Tables and Row Counts ===\n");

    // Get all tables
    const tables = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    console.log(`Found ${tables.rows.length} tables:\n`);

    // Count rows in each table
    for (const table of tables.rows) {
      const tableName = table.name;
      try {
        const count = await db.query(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        console.log(`  ${tableName}: ${count.rows[0].count} rows`);
      } catch (err: any) {
        console.log(`  ${tableName}: Error - ${err.message}`);
      }
    }

    console.log("\n=== Sample Data from Key Tables ===\n");

    // Check todos
    const todos = await db.query(
      "SELECT id, title, status, priority, created_at FROM todos ORDER BY id DESC LIMIT 5"
    );
    if (todos.rows.length > 0) {
      console.log("Recent Todos:");
      console.table(todos.rows);
    } else {
      console.log("Recent Todos: No data");
    }

    // Check projects
    const projects = await db.query(
      "SELECT id, name, status, created_at FROM projects ORDER BY id DESC LIMIT 5"
    );
    if (projects.rows.length > 0) {
      console.log("\nRecent Projects:");
      console.table(projects.rows);
    } else {
      console.log("\nRecent Projects: No data");
    }

    // Check mood tracking
    const moods = await db.query(
      "SELECT id, mood_score, energy_level, stress_level, notes FROM mood_tracking ORDER BY created_at DESC LIMIT 5"
    );
    if (moods.rows.length > 0) {
      console.log("\nRecent Mood Tracking:");
      console.table(moods.rows);
    } else {
      console.log("\nRecent Mood Tracking: No data");
    }

    // Check coping strategies (has data!)
    const strategies = await db.query(
      "SELECT id, strategy_name, strategy_category, effectiveness_rating, usage_count FROM coping_strategies LIMIT 10"
    );
    if (strategies.rows.length > 0) {
      console.log("\nCoping Strategies:");
      console.table(strategies.rows);
    } else {
      console.log("\nCoping Strategies: No data");
    }

    // Check reflection templates (has data!)
    const templates = await db.query(
      "SELECT id, template_name, template_type, frequency, is_active FROM reflection_templates LIMIT 5"
    );
    if (templates.rows.length > 0) {
      console.log("\nReflection Templates (sample):");
      console.table(templates.rows);
    } else {
      console.log("\nReflection Templates: No data");
    }

    // Check notes (notes table doesn't have a title column, only content)
    const notes = await db.query(
      "SELECT id, SUBSTR(content, 1, 50) as content_preview, created_at FROM notes ORDER BY created_at DESC LIMIT 3"
    );
    if (notes.rows.length > 0) {
      console.log("\nRecent Notes:");
      console.table(notes.rows);
    } else {
      console.log("\nRecent Notes: No data");
    }

    // Check user preferences (has data!)
    const prefs = await db.query(
      "SELECT preference_category, preference_key, preference_value FROM user_preferences LIMIT 10"
    );
    if (prefs.rows.length > 0) {
      console.log("\nUser Preferences (sample):");
      console.table(prefs.rows);
    } else {
      console.log("\nUser Preferences: No data");
    }

    // Check settings (has data!)
    const settings = await db.query(
      "SELECT key, value, description FROM settings LIMIT 10"
    );
    if (settings.rows.length > 0) {
      console.log("\nSettings:");
      console.table(settings.rows);
    } else {
      console.log("\nSettings: No data");
    }

    console.log("\n=== Database Check Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("Error checking database:", error);
    process.exit(1);
  }
}

checkDatabase();
