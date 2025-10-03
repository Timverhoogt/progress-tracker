/**
 * Global test setup
 * Runs before each test file
 */

import { initializeDatabase } from '../src/database/sqlite';
import { createTables } from '../src/database/migrate';
import path from 'path';
import fs from 'fs';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = path.join(__dirname, '../data/test_progress_tracker.db');
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'test-api-key';
process.env.LLM_MODEL = 'anthropic/claude-3.5-sonnet';
process.env.PORT = '3061'; // Different port for tests

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global setup before all tests
beforeAll(async () => {
  // Ensure test data directory exists
  const testDataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  // Initialize test database
  const db = initializeDatabase(process.env.SQLITE_DB_PATH);
  
  // Create tables
  await createTables();
  
  console.log('✅ Test database initialized');
});

// Clean up after each test
afterEach(async () => {
  // Optional: Clean up test data between tests
  // This can be customized based on test isolation needs
});

