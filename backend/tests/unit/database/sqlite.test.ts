/**
 * Unit tests for SQLite database service
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { getDatabase } from '../../../src/database/sqlite';
import { clearDatabase, generateUUID } from '../../helpers/test-utils';

describe('SQLite Database Service', () => {
  let db: ReturnType<typeof getDatabase>;

  beforeEach(async () => {
    db = getDatabase();
    await clearDatabase();
  });

  describe('Query Operations', () => {
    test('should execute SELECT query', async () => {
      const result = await db.query('SELECT * FROM projects');
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.rows)).toBe(true);
    });

    test('should execute INSERT query', async () => {
      const projectId = generateUUID();
      const result = await db.query(
        'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
        [projectId, 'Test Project', 'Test Description']
      );
      
      expect(result).toHaveProperty('rowsAffected');
      expect(result.rowsAffected).toBe(1);
    });

    test('should execute UPDATE query', async () => {
      // First insert a project
      const projectId = generateUUID();
      await db.query(
        'INSERT INTO projects (id, name) VALUES (?, ?)',
        [projectId, 'Original Name']
      );

      // Then update it
      const result = await db.query(
        'UPDATE projects SET name = ? WHERE id = ?',
        ['Updated Name', projectId]
      );

      expect(result.rowsAffected).toBe(1);

      // Verify the update
      const selectResult = await db.query(
        'SELECT name FROM projects WHERE id = ?',
        [projectId]
      );
      expect(selectResult.rows[0].name).toBe('Updated Name');
    });

    test('should execute DELETE query', async () => {
      // Insert a project
      const projectId = generateUUID();
      await db.query(
        'INSERT INTO projects (id, name) VALUES (?, ?)',
        [projectId, 'To Delete']
      );

      // Delete it
      const result = await db.query(
        'DELETE FROM projects WHERE id = ?',
        [projectId]
      );

      expect(result.rowsAffected).toBe(1);

      // Verify deletion
      const selectResult = await db.query(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      );
      expect(selectResult.rows.length).toBe(0);
    });
  });

  describe('Transaction Support', () => {
    test('should support transactions', async () => {
      const projectId = generateUUID();
      
      await db.transaction(async () => {
        await db.query(
          'INSERT INTO projects (id, name) VALUES (?, ?)',
          [projectId, 'Transaction Test']
        );
      });

      const result = await db.query(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      );
      expect(result.rows.length).toBe(1);
    });
  });

  describe('UUID Generation', () => {
    test('should generate valid UUIDs', () => {
      const uuid1 = db.generateUUID();
      const uuid2 = db.generateUUID();

      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('Timestamp Generation', () => {
    test('should generate current timestamp', () => {
      const timestamp = db.getCurrentTimestamp();
      expect(timestamp).toBe("datetime('now')");
    });
  });

  describe('JSON Operations', () => {
    test('should parse valid JSON', () => {
      const jsonString = '{"key": "value"}';
      const parsed = db.parseJSON(jsonString);
      expect(parsed).toEqual({ key: 'value' });
    });

    test('should return null for invalid JSON', () => {
      const invalidJson = 'not valid json';
      const parsed = db.parseJSON(invalidJson);
      expect(parsed).toBeNull();
    });
  });

  describe('Foreign Key Constraints', () => {
    test('should enforce foreign key constraints', async () => {
      const noteId = generateUUID();
      const invalidProjectId = generateUUID();

      // Try to insert a note with non-existent project_id
      await expect(
        db.query(
          'INSERT INTO notes (id, project_id, content) VALUES (?, ?, ?)',
          [noteId, invalidProjectId, 'Test content']
        )
      ).rejects.toThrow();
    });

    test('should cascade delete when parent is deleted', async () => {
      // Create project
      const projectId = generateUUID();
      await db.query(
        'INSERT INTO projects (id, name) VALUES (?, ?)',
        [projectId, 'Parent Project']
      );

      // Create note for project
      const noteId = generateUUID();
      await db.query(
        'INSERT INTO notes (id, project_id, content) VALUES (?, ?, ?)',
        [noteId, projectId, 'Child note']
      );

      // Delete project
      await db.query('DELETE FROM projects WHERE id = ?', [projectId]);

      // Verify note was also deleted (cascade)
      const noteResult = await db.query(
        'SELECT * FROM notes WHERE id = ?',
        [noteId]
      );
      expect(noteResult.rows.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid SQL', async () => {
      await expect(
        db.query('INVALID SQL STATEMENT')
      ).rejects.toThrow();
    });

    test('should throw error for invalid table name', async () => {
      await expect(
        db.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow();
    });
  });

  describe('Parameter Binding', () => {
    test('should properly bind parameters', async () => {
      const projectId = generateUUID();
      const name = "Test's Project"; // Contains single quote
      const description = 'Description with "quotes"';

      await db.query(
        'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
        [projectId, name, description]
      );

      const result = await db.query(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      );

      expect(result.rows[0].name).toBe(name);
      expect(result.rows[0].description).toBe(description);
    });
  });
});

