import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface QueryResult {
  rows: any[];
  rowsAffected?: number;
}

class SQLiteService {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'progress_tracker.db');
    
    // Ensure the directory exists
    const dbDir = path.dirname(this.dbPath);
    require('fs').mkdirSync(dbDir, { recursive: true });
    
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    console.log(`📁 SQLite database initialized at: ${this.dbPath}`);
  }

  // Main query method that mimics PostgreSQL pool.query()
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Handle different types of SQL operations
      const trimmedSql = sql.trim().toUpperCase();
      
      if (trimmedSql.startsWith('SELECT')) {
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);
        return { rows };
      } 
      else if (trimmedSql.startsWith('INSERT')) {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        
        // For INSERT with RETURNING, we need to fetch the inserted row
        if (sql.toUpperCase().includes('RETURNING')) {
          const selectSql = this.buildSelectFromInsert(sql, result.lastInsertRowid);
          const selectStmt = this.db.prepare(selectSql);
          const rows = selectStmt.all();
          return { rows, rowsAffected: result.changes };
        }
        
        return { rows: [], rowsAffected: result.changes };
      }
      else if (trimmedSql.startsWith('UPDATE') || trimmedSql.startsWith('DELETE')) {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        
        // For UPDATE/DELETE with RETURNING, we need special handling
        if (sql.toUpperCase().includes('RETURNING')) {
          // For updates/deletes, we'll need to modify the approach since SQLite doesn't support RETURNING
          // We'll return empty rows for now and handle this in the route-specific updates
          return { rows: [], rowsAffected: result.changes };
        }
        
        return { rows: [], rowsAffected: result.changes };
      }
      else {
        // For other operations like CREATE, DROP, etc.
        this.db.exec(sql);
        return { rows: [] };
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  // Helper method to build SELECT statement from INSERT with RETURNING
  private buildSelectFromInsert(insertSql: string, lastRowId: number | bigint): string {
    // Extract table name from INSERT statement
    const tableMatch = insertSql.match(/INSERT\s+INTO\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not parse table name from INSERT statement');
    }
    
    const tableName = tableMatch[1];
    
    // For SQLite, we'll select by rowid if no other unique identifier
    return `SELECT * FROM ${tableName} WHERE rowid = ${lastRowId}`;
  }

  // Generate UUID (since SQLite doesn't have built-in UUID generation)
  generateUUID(): string {
    return uuidv4();
  }

  // Current timestamp for SQLite
  getCurrentTimestamp(): string {
    return "datetime('now')";
  }

  // Helper method for JSON operations
  parseJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }

  // Transaction support
  async transaction(fn: () => Promise<void>): Promise<any> {
    const transaction = this.db.transaction(async () => {
      return await fn();
    });
    return await transaction();
  }

  // Close database connection
  close(): void {
    this.db.close();
  }

  // Get database instance for direct access if needed
  getDatabase(): Database.Database {
    return this.db;
  }

  // Backup database
  backup(backupPath: string): void {
    this.db.backup(backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
  }
}

// Create singleton instance
let sqliteService: SQLiteService;

export function initializeDatabase(dbPath?: string): SQLiteService {
  if (!sqliteService) {
    sqliteService = new SQLiteService(dbPath);
  }
  return sqliteService;
}

export function getDatabase(): SQLiteService {
  if (!sqliteService) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sqliteService;
}

export default SQLiteService;