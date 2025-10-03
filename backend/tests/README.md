# Progress Tracker Test Suite

## 📋 Overview

Comprehensive testing suite for the Progress Tracker backend application, following industry best practices and achieving high code coverage.

## 🎯 Test Categories

### Unit Tests (`tests/unit/`)

Test individual components in isolation:

- **Database Layer** (`database/`)
  - `sqlite.test.ts` - SQLite service operations
  - `backup.test.ts` - Backup and restore functionality

- **API Routes** (`routes/`)
  - `projects.test.ts` - Project CRUD operations
  - `notes.test.ts` - Note management with LLM enhancement
  - `todos.test.ts` - Todo management and generation

- **Services** (`services/`)
  - `llm.test.ts` - LLM service integration

### Integration Tests (`tests/integration/`)

Test complete workflows:

- `api.test.ts` - Full API integration scenarios
  - Complete project workflows
  - Cascade delete operations
  - Timeline integration
  - Error handling
  - Data consistency

### Test Helpers (`tests/helpers/`)

Utility functions for testing:

- `test-utils.ts` - Common test utilities
  - Database cleanup
  - Test data creation
  - Mock helpers
  - UUID generation

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm run test:watch
```

## 📊 Test Coverage

### Current Targets

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### View Coverage Report

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## 🧪 Test Structure

### Example Test File

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { clearDatabase, createTestProject } from '../helpers/test-utils';

describe('Feature Name', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  test('should perform expected behavior', async () => {
    // Arrange
    const data = { name: 'Test' };

    // Act
    const result = await someFunction(data);

    // Assert
    expect(result).toBeDefined();
  });
});
```

## 🛠️ Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:ci` | Run tests in CI mode |

## 📝 Test Utilities

### Database Helpers

```typescript
import {
  clearDatabase,
  createTestProject,
  createTestNote,
  createTestTodo,
  createTestMilestone
} from './helpers/test-utils';

// Clear all test data
await clearDatabase();

// Create test entities
const project = await createTestProject({ name: 'Test' });
const note = await createTestNote(project.id);
const todo = await createTestTodo(project.id);
```

### Mock Helpers

```typescript
import { mockLLMResponse } from './helpers/test-utils';

// Mock LLM service response
const mockResponse = mockLLMResponse({
  enhanced_content: 'Enhanced text'
});
```

## 🔍 Test Patterns

### Testing API Endpoints

```typescript
import request from 'supertest';

test('should create resource', async () => {
  const response = await request(app)
    .post('/api/resource')
    .send({ name: 'Test' })
    .expect(201);

  expect(response.body).toHaveProperty('id');
});
```

### Testing Database Operations

```typescript
import { getDatabase } from '../../src/database/sqlite';

test('should query database', async () => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM projects');
  expect(result.rows).toBeDefined();
});
```

### Testing Error Handling

```typescript
test('should handle errors gracefully', async () => {
  await expect(
    someFunction(invalidData)
  ).rejects.toThrow('Expected error message');
});
```

## 🎨 Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeEach(async () => {
  await clearDatabase();
});
```

### 2. Descriptive Names

Use clear, descriptive test names:

```typescript
test('should return 404 when project does not exist', async () => {
  // ...
});
```

### 3. Arrange-Act-Assert

Follow the AAA pattern:

```typescript
test('should update project', async () => {
  // Arrange
  const project = await createTestProject();

  // Act
  const result = await updateProject(project.id, { name: 'New' });

  // Assert
  expect(result.name).toBe('New');
});
```

### 4. Test Edge Cases

Don't just test happy paths:

```typescript
test('should reject empty input', async () => {
  await expect(createProject({ name: '' })).rejects.toThrow();
});

test('should handle very long input', async () => {
  const longName = 'a'.repeat(1000);
  await expect(createProject({ name: longName })).rejects.toThrow();
});
```

## 🐛 Debugging Tests

### Run Single Test File

```bash
npm test -- tests/unit/routes/projects.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should create"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## 📈 Continuous Integration

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

See `.github/workflows/backend-tests.yml` for CI configuration.

## 🔧 Troubleshooting

### Tests Timeout

Increase timeout in `jest.config.js` or individual tests:

```typescript
jest.setTimeout(30000);
```

### Database Locked

Ensure proper cleanup:

```typescript
afterEach(async () => {
  await clearDatabase();
});
```

### Mock Not Working

Define mocks before imports:

```typescript
jest.mock('../../src/services/llm');
import llmService from '../../src/services/llm';
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Main Testing Guide](../TESTING.md)

## ✅ Test Checklist

When adding new features:

- [ ] Write unit tests for new functions
- [ ] Write integration tests for new endpoints
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Maintain coverage thresholds
- [ ] Update documentation

## 📊 Test Statistics

Run `npm test -- --coverage` to see:

- Total test count
- Coverage percentages
- Slow tests
- Failed tests

## 🎯 Goals

- ✅ Comprehensive test coverage (>70%)
- ✅ Fast test execution (<30s)
- ✅ Reliable and deterministic tests
- ✅ Easy to write new tests
- ✅ Clear error messages
- ✅ CI/CD integration

---

**Happy Testing!** 🧪✨

