# Testing Guide for Progress Tracker Backend

## Overview

This document describes the comprehensive testing suite for the Progress Tracker backend application. The test suite follows industry best practices and includes unit tests, integration tests, and end-to-end tests.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Continuous Integration](#continuous-integration)

---

## Test Structure

```
backend/
├── tests/
│   ├── setup.ts                 # Global test setup
│   ├── teardown.ts              # Global test teardown
│   ├── helpers/
│   │   └── test-utils.ts        # Test utility functions
│   ├── unit/
│   │   ├── database/
│   │   │   └── sqlite.test.ts   # Database layer tests
│   │   ├── routes/
│   │   │   ├── projects.test.ts # Projects API tests
│   │   │   ├── notes.test.ts    # Notes API tests
│   │   │   └── todos.test.ts    # Todos API tests
│   │   └── services/
│   │       └── llm.test.ts      # LLM service tests
│   └── integration/
│       └── api.test.ts          # Full API integration tests
├── jest.config.js               # Jest configuration
└── package.json                 # Test scripts
```

---

## Running Tests

### Install Dependencies

```bash
cd backend
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test -- tests/unit/routes/projects.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should create"
```

---

## Test Coverage

### Coverage Thresholds

The project maintains the following minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### View Coverage Report

After running tests with coverage, open the HTML report:

```bash
# Run tests with coverage
npm test -- --coverage

# Open coverage report (Linux/Mac)
open coverage/lcov-report/index.html

# Open coverage report (Windows)
start coverage/lcov-report/index.html
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Text**: Displayed in terminal
- **LCOV**: `coverage/lcov.info` (for CI tools)
- **HTML**: `coverage/lcov-report/` (for browsing)

---

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*.test.ts` in `integration/` folder
- Test files should be co-located with the code they test or in the `tests/` directory

### Basic Test Structure

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { clearDatabase, createTestProject } from '../../helpers/test-utils';

describe('Feature Name', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Specific Functionality', () => {
    test('should do something specific', async () => {
      // Arrange
      const testData = { name: 'Test' };

      // Act
      const result = await someFunction(testData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test');
    });
  });
});
```

### Using Test Helpers

The `test-utils.ts` file provides helpful functions:

```typescript
import {
  clearDatabase,
  createTestProject,
  createTestNote,
  createTestTodo,
  createTestMilestone,
  createTestPreference,
  generateUUID,
  mockLLMResponse
} from '../helpers/test-utils';

// Clear all test data
await clearDatabase();

// Create test entities
const project = await createTestProject({ name: 'Test Project' });
const note = await createTestNote(project.id, { content: 'Test note' });
const todo = await createTestTodo(project.id, { title: 'Test todo' });
```

### Testing API Routes

```typescript
import request from 'supertest';
import express from 'express';
import projectRoutes from '../../../src/routes/projects';

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

test('should create a project', async () => {
  const response = await request(app)
    .post('/api/projects')
    .send({ name: 'New Project' })
    .expect(201);

  expect(response.body).toHaveProperty('id');
  expect(response.body.name).toBe('New Project');
});
```

### Mocking External Services

```typescript
import { jest } from '@jest/globals';

// Mock LLM service
jest.mock('../../../src/services/llm', () => ({
  default: {
    enhanceNote: jest.fn().mockResolvedValue({
      success: true,
      data: JSON.stringify({ enhanced_content: 'Enhanced' })
    })
  }
}));
```

### Testing Database Operations

```typescript
import { getDatabase } from '../../../src/database/sqlite';

test('should insert and retrieve data', async () => {
  const db = getDatabase();
  const id = generateUUID();

  await db.query(
    'INSERT INTO projects (id, name) VALUES (?, ?)',
    [id, 'Test']
  );

  const result = await db.query(
    'SELECT * FROM projects WHERE id = ?',
    [id]
  );

  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].name).toBe('Test');
});
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
beforeEach(async () => {
  await clearDatabase(); // Clean slate for each test
});
```

### 2. Descriptive Test Names

Use clear, descriptive test names:

```typescript
// Good
test('should return 404 when project does not exist', async () => {});

// Bad
test('test1', async () => {});
```

### 3. Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
test('should update project name', async () => {
  // Arrange
  const project = await createTestProject({ name: 'Original' });

  // Act
  const response = await request(app)
    .put(`/api/projects/${project.id}`)
    .send({ name: 'Updated' });

  // Assert
  expect(response.body.name).toBe('Updated');
});
```

### 4. Test Edge Cases

Don't just test the happy path:

```typescript
test('should reject empty name', async () => {
  const response = await request(app)
    .post('/api/projects')
    .send({ name: '' })
    .expect(400);
});

test('should handle very long names', async () => {
  const longName = 'a'.repeat(256);
  await request(app)
    .post('/api/projects')
    .send({ name: longName })
    .expect(400);
});
```

### 5. Use Async/Await

Always use async/await for asynchronous operations:

```typescript
test('should create project', async () => {
  const result = await createTestProject();
  expect(result).toBeDefined();
});
```

### 6. Clean Up Resources

Ensure proper cleanup in teardown:

```typescript
afterEach(async () => {
  // Clean up any resources
});

afterAll(async () => {
  // Close connections, etc.
});
```

---

## Continuous Integration

### GitHub Actions

The test suite is designed to run in CI environments:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend && npm install
      - run: cd backend && npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

### CI-Specific Test Command

```bash
npm run test:ci
```

This command:
- Runs all tests
- Generates coverage reports
- Uses limited workers for CI environments
- Exits with proper status codes

---

## Debugging Tests

### Run Tests in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

### Show Individual Test Results

```bash
npm test -- --verbose --expand
```

---

## Common Issues

### Issue: Tests Timeout

**Solution**: Increase timeout in jest.config.js or individual tests:

```typescript
jest.setTimeout(30000); // 30 seconds

test('long running test', async () => {
  // test code
}, 30000); // 30 second timeout for this test
```

### Issue: Database Locked

**Solution**: Ensure proper cleanup and test isolation:

```typescript
afterEach(async () => {
  await clearDatabase();
});
```

### Issue: Mock Not Working

**Solution**: Ensure mocks are defined before imports:

```typescript
jest.mock('../../../src/services/llm');
import llmService from '../../../src/services/llm';
```

---

## Test Metrics

### Current Coverage

Run `npm test -- --coverage` to see current metrics.

### Test Performance

Monitor test execution time:

```bash
npm test -- --verbose
```

Look for slow tests and optimize as needed.

---

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update this documentation if needed

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

## Summary

✅ **Comprehensive test suite** covering unit, integration, and E2E tests  
✅ **70% minimum coverage** across all metrics  
✅ **CI/CD ready** with proper configuration  
✅ **Well-documented** with examples and best practices  
✅ **Easy to run** with npm scripts  

Happy testing! 🧪

