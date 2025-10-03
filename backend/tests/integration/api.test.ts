/**
 * Integration tests for the complete API
 * Tests the full workflow of creating projects, notes, and todos
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from '../../src/database/sqlite';
import { clearDatabase } from '../helpers/test-utils';

// Import routes
import projectRoutes from '../../src/routes/projects';
import noteRoutes from '../../src/routes/notes';
import todoRoutes from '../../src/routes/todos';
import timelineRoutes from '../../src/routes/timelines';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/projects', projectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/timelines', timelineRoutes);

// Mock pool for routes
global.pool = initializeDatabase();

describe('API Integration Tests', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Complete Project Workflow', () => {
    test('should create project, add notes and todos, then retrieve all data', async () => {
      // 1. Create a project
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'Integration Test Project',
          description: 'Testing the complete workflow'
        })
        .expect(201);

      const projectId = projectResponse.body.id;
      expect(projectId).toBeDefined();

      // 2. Add a note to the project
      const noteResponse = await request(app)
        .post('/api/notes')
        .send({
          project_id: projectId,
          content: 'First project note'
        })
        .expect(201);

      expect(noteResponse.body.project_id).toBe(projectId);

      // 3. Add todos to the project
      const todo1Response = await request(app)
        .post('/api/todos')
        .send({
          project_id: projectId,
          title: 'First todo',
          priority: 'high'
        })
        .expect(201);

      const todo2Response = await request(app)
        .post('/api/todos')
        .send({
          project_id: projectId,
          title: 'Second todo',
          priority: 'medium'
        })
        .expect(201);

      // 4. Retrieve all notes for the project
      const notesResponse = await request(app)
        .get('/api/notes')
        .query({ project_id: projectId })
        .expect(200);

      expect(notesResponse.body).toHaveLength(1);

      // 5. Retrieve all todos for the project
      const todosResponse = await request(app)
        .get('/api/todos')
        .query({ project_id: projectId })
        .expect(200);

      expect(todosResponse.body).toHaveLength(2);

      // 6. Update a todo
      await request(app)
        .put(`/api/todos/${todo1Response.body.id}`)
        .send({ status: 'completed' })
        .expect(200);

      // 7. Verify the update
      const updatedTodosResponse = await request(app)
        .get('/api/todos')
        .query({ project_id: projectId })
        .expect(200);

      const completedTodo = updatedTodosResponse.body.find(
        (t: any) => t.id === todo1Response.body.id
      );
      expect(completedTodo.status).toBe('completed');

      // 8. Update project status
      await request(app)
        .put(`/api/projects/${projectId}`)
        .send({ status: 'on_hold' })
        .expect(200);

      // 9. Verify project update
      const updatedProjectResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(updatedProjectResponse.body.status).toBe('on_hold');
    });

    test('should handle cascade delete when project is deleted', async () => {
      // Create project
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'To Delete' })
        .expect(201);

      const projectId = projectResponse.body.id;

      // Add note
      const noteResponse = await request(app)
        .post('/api/notes')
        .send({
          project_id: projectId,
          content: 'Note to be deleted'
        })
        .expect(201);

      const noteId = noteResponse.body.id;

      // Add todo
      const todoResponse = await request(app)
        .post('/api/todos')
        .send({
          project_id: projectId,
          title: 'Todo to be deleted'
        })
        .expect(201);

      const todoId = todoResponse.body.id;

      // Delete project
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(204);

      // Verify note was deleted
      await request(app)
        .get(`/api/notes/${noteId}`)
        .expect(404);

      // Verify project was deleted
      await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });
  });

  describe('Timeline Integration', () => {
    test('should retrieve timeline data for project with todos and milestones', async () => {
      // Create project
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Timeline Project' })
        .expect(201);

      const projectId = projectResponse.body.id;

      // Add todos with due dates
      await request(app)
        .post('/api/todos')
        .send({
          project_id: projectId,
          title: 'Todo with due date',
          due_date: '2025-12-31'
        })
        .expect(201);

      // Get timeline
      const timelineResponse = await request(app)
        .get('/api/timelines')
        .query({ project_id: projectId })
        .expect(200);

      expect(timelineResponse.body).toHaveProperty('todos');
      expect(timelineResponse.body).toHaveProperty('milestones');
      expect(timelineResponse.body.todos).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid project_id gracefully', async () => {
      const invalidId = 'not-a-uuid';

      await request(app)
        .get(`/api/projects/${invalidId}`)
        .expect(404);
    });

    test('should handle non-existent project when creating note', async () => {
      const fakeProjectId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .post('/api/notes')
        .send({
          project_id: fakeProjectId,
          content: 'Note for non-existent project'
        })
        .expect(404);
    });

    test('should validate required fields', async () => {
      // Missing name
      await request(app)
        .post('/api/projects')
        .send({ description: 'No name' })
        .expect(400);

      // Missing content
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Test' })
        .expect(201);

      await request(app)
        .post('/api/notes')
        .send({ project_id: projectResponse.body.id })
        .expect(400);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain referential integrity', async () => {
      // Create project
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Integrity Test' })
        .expect(201);

      const projectId = projectResponse.body.id;

      // Create note
      await request(app)
        .post('/api/notes')
        .send({
          project_id: projectId,
          content: 'Test note'
        })
        .expect(201);

      // Verify note is linked to project
      const notesResponse = await request(app)
        .get('/api/notes')
        .query({ project_id: projectId })
        .expect(200);

      expect(notesResponse.body[0].project_id).toBe(projectId);
    });

    test('should handle concurrent updates', async () => {
      // Create project
      const projectResponse = await request(app)
        .post('/api/projects')
        .send({ name: 'Concurrent Test' })
        .expect(201);

      const projectId = projectResponse.body.id;

      // Perform concurrent updates
      const updates = [
        request(app).put(`/api/projects/${projectId}`).send({ name: 'Update 1' }),
        request(app).put(`/api/projects/${projectId}`).send({ name: 'Update 2' }),
        request(app).put(`/api/projects/${projectId}`).send({ name: 'Update 3' })
      ];

      await Promise.all(updates);

      // Verify project still exists and has one of the names
      const finalResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(finalResponse.body.name).toMatch(/Update [123]/);
    });
  });
});

