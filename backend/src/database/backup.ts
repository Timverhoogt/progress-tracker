import { getDatabase, reinitializeDatabase } from "./sqlite";
import path from "path";
import fs from "fs";

interface BackupOptions {
  backupPath?: string;
  includeTimestamp?: boolean;
}

class BackupService {
  /**
   * Create a backup of the SQLite database
   */
  static async createBackup(options: BackupOptions = {}): Promise<string> {
    const db = getDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const backupDir = path.join(process.cwd(), "backups");

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    let backupFileName = "progress_tracker_backup.db";
    if (options.includeTimestamp !== false) {
      backupFileName = `progress_tracker_backup_${timestamp}.db`;
    }

    let backupPath = options.backupPath || path.join(backupDir, backupFileName);

    // If backupPath is a directory, append the filename
    if (
      options.backupPath &&
      fs.existsSync(options.backupPath) &&
      fs.statSync(options.backupPath).isDirectory()
    ) {
      backupPath = path.join(options.backupPath, backupFileName);
    } else if (options.backupPath && !fs.existsSync(options.backupPath)) {
      // If path doesn't exist, check if it looks like a directory (no extension)
      const ext = path.extname(options.backupPath);
      if (!ext) {
        // Treat as directory
        fs.mkdirSync(options.backupPath, { recursive: true });
        backupPath = path.join(options.backupPath, backupFileName);
      }
    }

    // Ensure the directory for the backup file exists
    const backupFileDir = path.dirname(backupPath);
    if (!fs.existsSync(backupFileDir)) {
      fs.mkdirSync(backupFileDir, { recursive: true });
    }

    try {
      // Use better-sqlite3's backup functionality
      const rawDb = db.getDatabase();

      // backup() is synchronous in better-sqlite3 v9+
      // It takes a destination path and optional options
      await rawDb.backup(backupPath);

      console.log(`✅ Database backup created successfully: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error("❌ Error creating database backup:", error);
      console.error("Backup path:", backupPath);
      throw error;
    }
  }

  /**
   * Restore database from a backup
   */
  static async restoreBackup(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Check if backupPath is a directory (common test mistake)
    if (fs.statSync(backupPath).isDirectory()) {
      throw new Error(`Backup path is a directory, not a file: ${backupPath}`);
    }

    try {
      const db = getDatabase();
      // Get the current database path from the database instance
      const currentDbPath = db.getDbPath();

      // Close current database connection
      db.close();

      // Replace current database with backup
      fs.copyFileSync(backupPath, currentDbPath);

      // Reinitialize the database connection with the same path
      reinitializeDatabase(currentDbPath);

      console.log(`✅ Database restored successfully from: ${backupPath}`);
      console.log("⚠️  Database connection has been reinitialized.");
    } catch (error) {
      console.error("❌ Error restoring database backup:", error);
      throw error;
    }
  }

  /**
   * List all available backups
   */
  static listBackups(): string[] {
    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(backupDir)) {
      return [];
    }

    return fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith(".db"))
      .map((file) => path.join(backupDir, file))
      .sort((a, b) => {
        // Sort by modification time, newest first
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtime.getTime() - statA.mtime.getTime();
      });
  }

  /**
   * Export database to JSON for inspection/migration
   */
  static async exportToJSON(outputPath?: string): Promise<string> {
    const db = getDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const exportDir = path.join(process.cwd(), "exports");

    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportFileName = `progress_tracker_export_${timestamp}.json`;
    const exportPath = outputPath || path.join(exportDir, exportFileName);

    try {
      // Export all tables to JSON
      const exportData: any = {
        exported_at: new Date().toISOString(),
        version: "1.0",
        tables: {},
      };

      // Get all table names
      const tables = await db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      for (const table of tables.rows) {
        const tableName = table.name;
        const tableData = await db.query(`SELECT * FROM ${tableName}`);
        exportData.tables[tableName] = tableData.rows;
      }

      // Write to file
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      console.log(`✅ Database exported to JSON: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error("❌ Error exporting database to JSON:", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<object> {
    const db = getDatabase();

    try {
      const stats: any = {
        database_size: "0 bytes",
        tables: {},
      };

      // Get database file size
      const dbPath = path.join(process.cwd(), "data", "progress_tracker.db");
      if (fs.existsSync(dbPath)) {
        const fileStats = fs.statSync(dbPath);
        stats.database_size = `${(fileStats.size / 1024).toFixed(2)} KB`;
      }

      // Get table statistics
      const tables = await db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      for (const table of tables.rows) {
        const tableName = table.name;
        const countResult = await db.query(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        stats.tables[tableName] = {
          row_count: countResult.rows[0].count,
        };
      }

      return stats;
    } catch (error) {
      console.error("❌ Error getting database statistics:", error);
      throw error;
    }
  }
}

export default BackupService;
