/**
 * Unit tests for Todos API routes
 */

import { describe, test, expect, beforeEach, afterAll, jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// Mock LLM service BEFORE importing routes
const mockGenerateTodos = jest.fn<(...args: any[]) => Promise<any>>();
mockGenerateTodos.mockResolvedValue({
  success: true,
  data: JSON.stringify([
    { title: "Generated Todo 1", priority: "high" },
    { title: "Generated Todo 2", priority: "medium" },
  ]),
});

jest.mock("../../../src/services/llm", () => ({
  __esModule: true,
  default: {
    generateTodos: mockGenerateTodos,
  },
}));

import todoRoutes from "../../../src/routes/todos";
import { initializeDatabase, getDatabase } from "../../../src/database/sqlite";
import {
  clearDatabase,
  createTestProject,
  createTestTodo,
} from "../../helpers/test-utils";

// Create test app
const app = express();
app.use(express.json());
app.use("/api/todos", todoRoutes);

// Mock pool for routes
(global as any).pool = initializeDatabase();

describe("Todos API Routes", () => {
  let testProject: any;

  beforeEach(async () => {
    await clearDatabase();
    testProject = await createTestProject({ name: "Test Project" });
  });

  afterAll(() => {
    try {
      const db = getDatabase();
      db.close();
    } catch (error) {
      // Database might already be closed
    }
  });

  describe("GET /api/todos", () => {
    test("should return 400 without project_id", async () => {
      const response = await request(app).get("/api/todos").expect(400);

      expect(response.body.error).toBe("project_id is required");
    });

    test("should return empty array when no todos exist", async () => {
      const response = await request(app)
        .get("/api/todos")
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test("should return all todos for a project", async () => {
      await createTestTodo(testProject.id, { title: "Todo 1" });
      await createTestTodo(testProject.id, { title: "Todo 2" });

      const response = await request(app)
        .get("/api/todos")
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("status");
    });
  });

  describe("POST /api/todos", () => {
    test("should create a new todo", async () => {
      const todoData = {
        project_id: testProject.id,
        title: "New Todo",
        description: "Todo description",
        priority: "high",
        due_date: "2025-12-31",
      };

      const response = await request(app)
        .post("/api/todos")
        .send(todoData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(todoData.title);
      expect(response.body.description).toBe(todoData.description);
      expect(response.body.priority).toBe(todoData.priority);
      expect(response.body.status).toBe("pending");
    });

    test("should create todo with default priority", async () => {
      const todoData = {
        project_id: testProject.id,
        title: "Todo without priority",
      };

      const response = await request(app)
        .post("/api/todos")
        .send(todoData)
        .expect(201);

      expect(response.body.priority).toBe("medium");
    });

    test("should reject todo without project_id", async () => {
      const todoData = {
        title: "Todo without project",
      };

      const response = await request(app)
        .post("/api/todos")
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should reject todo without title", async () => {
      const todoData = {
        project_id: testProject.id,
        description: "No title",
      };

      const response = await request(app)
        .post("/api/todos")
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should reject todo with invalid priority", async () => {
      const todoData = {
        project_id: testProject.id,
        title: "Invalid priority",
        priority: "invalid",
      };

      const response = await request(app)
        .post("/api/todos")
        .send(todoData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/todos/:id", () => {
    test("should update todo title", async () => {
      const todo = await createTestTodo(testProject.id, { title: "Original" });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ title: "Updated Title" })
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
    });

    test("should update todo status", async () => {
      const todo = await createTestTodo(testProject.id, { status: "pending" });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ status: "completed" })
        .expect(200);

      expect(response.body.status).toBe("completed");
    });

    test("should update todo priority", async () => {
      const todo = await createTestTodo(testProject.id, { priority: "low" });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ priority: "high" })
        .expect(200);

      expect(response.body.priority).toBe("high");
    });

    test("should update multiple fields", async () => {
      const todo = await createTestTodo(testProject.id);

      const updates = {
        title: "New Title",
        description: "New Description",
        status: "in_progress",
        priority: "high",
      };

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.status).toBe(updates.status);
      expect(response.body.priority).toBe(updates.priority);
    });

    test("should return 404 for non-existent todo", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await request(app)
        .put(`/api/todos/${fakeId}`)
        .send({ title: "Updated" })
        .expect(404);
    });

    test("should reject invalid status", async () => {
      const todo = await createTestTodo(testProject.id);

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ status: "invalid_status" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/todos/:id", () => {
    test("should delete a todo", async () => {
      const todo = await createTestTodo(testProject.id);

      await request(app).delete(`/api/todos/${todo.id}`).expect(204);

      // Verify deletion
      const response = await request(app)
        .get("/api/todos")
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    test("should return 404 for non-existent todo", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await request(app).delete(`/api/todos/${fakeId}`).expect(404);
    });
  });

  describe("POST /api/todos/generate", () => {
    test("should generate AI todos for a project", async () => {
      const response = await request(app)
        .post("/api/todos/generate")
        .send({ project_id: testProject.id })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0].llm_generated).toBe(1);
    });

    test("should return 400 without project_id", async () => {
      const response = await request(app)
        .post("/api/todos/generate")
        .send({})
        .expect(400);

      expect(response.body.error).toBe("project_id is required");
    });

    test("should return 404 for non-existent project", async () => {
      const fakeProjectId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post("/api/todos/generate")
        .send({ project_id: fakeProjectId })
        .expect(404);

      expect(response.body.error).toBe("Project not found");
    });
  });

  describe("Todo Filtering and Sorting", () => {
    test("should return todos ordered by created_at DESC", async () => {
      const todo1 = await createTestTodo(testProject.id, { title: "First" });
      // Wait to ensure different timestamps (SQLite datetime has second precision)
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const todo2 = await createTestTodo(testProject.id, { title: "Second" });

      // Manually update todo2 to ensure it has a later timestamp
      const db = getDatabase();
      await db.query("UPDATE todos SET created_at = datetime('now', '+1 second') WHERE id = ?", [todo2.id]);

      const response = await request(app)
        .get("/api/todos")
        .query({ project_id: testProject.id })
        .expect(200);

      expect(response.body[0].title).toBe("Second");
      expect(response.body[1].title).toBe("First");
    });
  });
});
