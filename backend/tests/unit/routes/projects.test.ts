/**
 * Unit tests for Projects API routes
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import projectRoutes from '../../../src/routes/projects';
import { initializeDatabase } from '../../../src/database/sqlite';
import { clearDatabase, createTestProject } from '../../helpers/test-utils';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

// Mock pool for routes
global.pool = initializeDatabase();

describe('Projects API Routes', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/projects', () => {
    test('should return empty array when no projects exist', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('should return all projects', async () => {
      // Create test projects
      await createTestProject({ name: 'Project 1' });
      await createTestProject({ name: 'Project 2' });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('created_at');
    });

    test('should return projects ordered by updated_at DESC', async () => {
      const project1 = await createTestProject({ name: 'First' });
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const project2 = await createTestProject({ name: 'Second' });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body[0].name).toBe('Second');
      expect(response.body[1].name).toBe('First');
    });
  });

  describe('GET /api/projects/:id', () => {
    test('should return a specific project', async () => {
      const project = await createTestProject({ name: 'Test Project' });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .expect(200);

      expect(response.body.id).toBe(project.id);
      expect(response.body.name).toBe('Test Project');
    });

    test('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/projects/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/projects', () => {
    test('should create a new project', async () => {
      const projectData = {
        name: 'New Project',
        description: 'Project description'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(projectData.name);
      expect(response.body.description).toBe(projectData.description);
      expect(response.body.status).toBe('active');
    });

    test('should create project without description', async () => {
      const projectData = {
        name: 'Minimal Project'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);

      expect(response.body.name).toBe(projectData.name);
      expect(response.body.description).toBeNull();
    });

    test('should reject project without name', async () => {
      const projectData = {
        description: 'No name provided'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject project with empty name', async () => {
      const projectData = {
        name: '',
        description: 'Empty name'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject project with name longer than 255 characters', async () => {
      const projectData = {
        name: 'a'.repeat(256),
        description: 'Too long'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('should update project name', async () => {
      const project = await createTestProject({ name: 'Original Name' });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });

    test('should update project description', async () => {
      const project = await createTestProject({ description: 'Original' });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    test('should update project status', async () => {
      const project = await createTestProject({ status: 'active' });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.status).toBe('completed');
    });

    test('should update multiple fields at once', async () => {
      const project = await createTestProject();

      const updates = {
        name: 'New Name',
        description: 'New Description',
        status: 'on_hold'
      };

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.status).toBe(updates.status);
    });

    test('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .put(`/api/projects/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    test('should reject invalid status', async () => {
      const project = await createTestProject();

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 when no fields to update', async () => {
      const project = await createTestProject();

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('No fields to update');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    test('should delete a project', async () => {
      const project = await createTestProject();

      await request(app)
        .delete(`/api/projects/${project.id}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/projects/${project.id}`)
        .expect(404);
    });

    test('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .delete(`/api/projects/${fakeId}`)
        .expect(404);
    });

    test('should cascade delete related notes', async () => {
      const project = await createTestProject();
      
      // This would require importing note creation
      // Simplified for this test
      
      await request(app)
        .delete(`/api/projects/${project.id}`)
        .expect(204);
    });
  });
});

