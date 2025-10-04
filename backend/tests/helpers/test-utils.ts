/**
 * Test utilities and helper functions
 */

import { getDatabase } from '../../src/database/sqlite';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clear all data from test database
 */
export async function clearDatabase() {
  const db = getDatabase();
  
  // Get all table names
  const tables = [
    'notes',
    'todos',
    'milestones',
    'reports',
    'projects',
    'user_preferences',
    'skills_assessment',
    'achievements',
    'mood_tracking',
    'learning_paths',
    'coaching_sessions',
    'reflection_responses',
    'best_practices',
    'coping_strategies',
    'coping_strategy_usage',
    'gratitude_entries',
    'intervention_logs',
    'work_preferences',
    'workload_tracking',
    'settings'
  ];
  
  // Delete all data from tables
  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table}`);
    } catch (error) {
      // Table might not exist, ignore
    }
  }
}

/**
 * Create a test project
 */
export async function createTestProject(data?: Partial<{
  name: string;
  description: string;
  status: string;
}>) {
  const db = getDatabase();
  const projectId = uuidv4();

  await db.query(
    'INSERT INTO projects (id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))',
    [
      projectId,
      data?.name || 'Test Project',
      data?.description || 'Test project description',
      data?.status || 'active'
    ]
  );

  const result = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
  return result.rows[0];
}

/**
 * Create a test note
 */
export async function createTestNote(projectId: string, data?: Partial<{
  content: string;
  enhanced_content: string;
  structured_data: string;
}>) {
  const db = getDatabase();
  const noteId = uuidv4();

  await db.query(
    'INSERT INTO notes (id, project_id, content, enhanced_content, structured_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))',
    [
      noteId,
      projectId,
      data?.content || 'Test note content',
      data?.enhanced_content || null,
      data?.structured_data || null
    ]
  );

  const result = await db.query('SELECT * FROM notes WHERE id = ?', [noteId]);
  return result.rows[0];
}

/**
 * Create a test todo
 */
export async function createTestTodo(projectId: string, data?: Partial<{
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
}>) {
  const db = getDatabase();
  const todoId = uuidv4();

  await db.query(
    'INSERT INTO todos (id, project_id, title, description, status, priority, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))',
    [
      todoId,
      projectId,
      data?.title || 'Test todo',
      data?.description || 'Test todo description',
      data?.status || 'pending',
      data?.priority || 'medium',
      data?.due_date || null
    ]
  );

  const result = await db.query('SELECT * FROM todos WHERE id = ?', [todoId]);
  return result.rows[0];
}

/**
 * Create a test milestone
 */
export async function createTestMilestone(projectId: string, data?: Partial<{
  title: string;
  description: string;
  status: string;
  target_date: string;
}>) {
  const db = getDatabase();
  const milestoneId = uuidv4();
  
  await db.query(
    'INSERT INTO milestones (id, project_id, title, description, status, target_date) VALUES (?, ?, ?, ?, ?, ?)',
    [
      milestoneId,
      projectId,
      data?.title || 'Test milestone',
      data?.description || 'Test milestone description',
      data?.status || 'pending',
      data?.target_date || '2025-12-31'
    ]
  );
  
  const result = await db.query('SELECT * FROM milestones WHERE id = ?', [milestoneId]);
  return result.rows[0];
}

/**
 * Create test user preferences
 */
export async function createTestPreference(data?: Partial<{
  user_id: string;
  preference_category: string;
  preference_key: string;
  preference_value: string;
}>) {
  const db = getDatabase();
  const prefId = uuidv4();
  
  await db.query(
    'INSERT INTO user_preferences (id, user_id, preference_category, preference_key, preference_value) VALUES (?, ?, ?, ?, ?)',
    [
      prefId,
      data?.user_id || 'default',
      data?.preference_category || 'coaching',
      data?.preference_key || 'style',
      data?.preference_value || 'supportive'
    ]
  );
  
  const result = await db.query('SELECT * FROM user_preferences WHERE id = ?', [prefId]);
  return result.rows[0];
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Mock LLM response
 */
export function mockLLMResponse(data: any) {
  return {
    success: true,
    data: JSON.stringify(data)
  };
}

/**
 * Generate random UUID
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Get current timestamp in SQLite format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

