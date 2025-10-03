/**
 * Global test teardown
 * Runs after all tests complete
 */

import { getDatabase } from '../src/database/sqlite';
import fs from 'fs';
import path from 'path';

module.exports = async () => {
  try {
    // Close database connection
    const db = getDatabase();
    db.close();
    
    // Clean up test database file
    const testDbPath = path.join(__dirname, '../data/test_progress_tracker.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Clean up WAL and SHM files
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    
    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath);
    }
    
    if (fs.existsSync(shmPath)) {
      fs.unlinkSync(shmPath);
    }
    
    console.log('✅ Test cleanup complete');
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
};

