/**
 * Unit tests for Notes API routes
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import noteRoutes from '../../../src/routes/notes';
import { initializeDatabase } from '../../../src/database/sqlite';
import { clearDatabase, createTestProject, createTestNote } from '../../helpers/test-utils';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/notes', noteRoutes);

// Mock pool for routes
global.pool = initializeDatabase();

// Mock LLM service
jest.mock('../../../src/services/llm', () => ({
  default: {
    enhanceNote: jest.fn().mockResolvedValue({
      success: true,
      data: JSON.stringify({
        enhanced_content: 'Enhanced test content',
        key_points: ['Point 1', 'Point 2'],
        action_items: ['Action 1']
      })
    })
  }
}));

describe('Notes API Routes', () => {
  let testProject: any;

  beforeEach(async () => {
    await clearDatabase();
    testProject = await createTestProject({ name: 'Test Project' });
  });

  describe('GET /api/notes', () => {
    test('should return 400 without project_id', async () => {
      const response = await request(app)
        .get('/api/notes')
        .expect(400);

      expect(response.body.error).toBe('project_id is required');
    });

    test('should return empty array when no notes exist', async () => {
      const response = await request(app)
        .get('/api/notes')
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('should return all notes for a project', async () => {
      await createTestNote(testProject.id, { content: 'Note 1' });
      await createTestNote(testProject.id, { content: 'Note 2' });

      const response = await request(app)
        .get('/api/notes')
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('project_id');
    });

    test('should parse structured_data JSON', async () => {
      const structuredData = JSON.stringify({ key: 'value' });
      await createTestNote(testProject.id, { structured_data: structuredData });

      const response = await request(app)
        .get('/api/notes')
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body[0].structured_data).toEqual({ key: 'value' });
    });

    test('should return notes ordered by created_at DESC', async () => {
      await createTestNote(testProject.id, { content: 'First' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestNote(testProject.id, { content: 'Second' });

      const response = await request(app)
        .get('/api/notes')
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body[0].content).toBe('Second');
      expect(response.body[1].content).toBe('First');
    });
  });

  describe('GET /api/notes/:id', () => {
    test('should return a specific note', async () => {
      const note = await createTestNote(testProject.id, { content: 'Test Note' });

      const response = await request(app)
        .get(`/api/notes/${note.id}`)
        .expect(200);

      expect(response.body.id).toBe(note.id);
      expect(response.body.content).toBe('Test Note');
    });

    test('should return 404 for non-existent note', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/notes/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Note not found');
    });
  });

  describe('POST /api/notes', () => {
    test('should create a new note with LLM enhancement', async () => {
      const noteData = {
        project_id: testProject.id,
        content: 'This is a test note'
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(noteData.content);
      expect(response.body.enhanced_content).toBe('Enhanced test content');
      expect(response.body.project_id).toBe(testProject.id);
    });

    test('should reject note without project_id', async () => {
      const noteData = {
        content: 'Test note'
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject note without content', async () => {
      const noteData = {
        project_id: testProject.id
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject note with empty content', async () => {
      const noteData = {
        project_id: testProject.id,
        content: ''
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 for non-existent project', async () => {
      const fakeProjectId = '00000000-0000-0000-0000-000000000000';
      const noteData = {
        project_id: fakeProjectId,
        content: 'Test note'
      };

      const response = await request(app)
        .post('/api/notes')
        .send(noteData)
        .expect(404);

      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('PUT /api/notes/:id', () => {
    test('should update note content', async () => {
      const note = await createTestNote(testProject.id, { content: 'Original' });

      const response = await request(app)
        .put(`/api/notes/${note.id}`)
        .send({ content: 'Updated content' })
        .expect(200);

      expect(response.body.content).toBe('Updated content');
      expect(response.body.enhanced_content).toBe('Enhanced test content');
    });

    test('should return 404 for non-existent note', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .put(`/api/notes/${fakeId}`)
        .send({ content: 'Updated' })
        .expect(404);
    });

    test('should reject update without content', async () => {
      const note = await createTestNote(testProject.id);

      const response = await request(app)
        .put(`/api/notes/${note.id}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    test('should delete a note', async () => {
      const note = await createTestNote(testProject.id);

      await request(app)
        .delete(`/api/notes/${note.id}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/notes/${note.id}`)
        .expect(404);
    });

    test('should return 404 for non-existent note', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .delete(`/api/notes/${fakeId}`)
        .expect(404);
    });
  });

  describe('Structured Data Parsing', () => {
    test('should handle invalid JSON in structured_data gracefully', async () => {
      const note = await createTestNote(testProject.id, {
        structured_data: 'invalid json'
      });

      const response = await request(app)
        .get(`/api/notes/${note.id}`)
        .expect(200);

      // Should return the string as-is if parsing fails
      expect(typeof response.body.structured_data).toBe('string');
    });

    test('should handle null structured_data', async () => {
      const note = await createTestNote(testProject.id, {
        structured_data: null as any
      });

      const response = await request(app)
        .get(`/api/notes/${note.id}`)
        .expect(200);

      expect(response.body.structured_data).toBeNull();
    });
  });
});

