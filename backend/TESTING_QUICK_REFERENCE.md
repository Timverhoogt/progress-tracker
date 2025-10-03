# Testing Quick Reference Card

## 🚀 Quick Start

```bash
cd backend
npm install
npm test
```

---

## 📝 Common Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Watch mode (auto-rerun on changes) |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm test -- --coverage` | Generate coverage report |
| `npm test -- --verbose` | Detailed output |

---

## 🎯 Test Runner Scripts

### Linux/Mac
```bash
./run-tests.sh all          # All tests
./run-tests.sh unit         # Unit tests
./run-tests.sh integration  # Integration tests
./run-tests.sh coverage     # With coverage report
./run-tests.sh watch        # Watch mode
./run-tests.sh quick        # Fast (no coverage)
./run-tests.sh help         # Show help
```

### Windows
```cmd
run-tests.bat all
run-tests.bat unit
run-tests.bat coverage
run-tests.bat watch
run-tests.bat help
```

---

## 🧪 Writing Tests

### Basic Test Structure

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { clearDatabase, createTestProject } from '../helpers/test-utils';

describe('Feature Name', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  test('should do something', async () => {
    // Arrange
    const data = { name: 'Test' };

    // Act
    const result = await someFunction(data);

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe('Test');
  });
});
```

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

### Using Test Helpers

```typescript
import {
  clearDatabase,
  createTestProject,
  createTestNote,
  createTestTodo
} from '../helpers/test-utils';

// Clear database
await clearDatabase();

// Create test data
const project = await createTestProject({ name: 'Test' });
const note = await createTestNote(project.id);
const todo = await createTestTodo(project.id);
```

---

## 🔍 Debugging

### Run Single Test File
```bash
npm test -- tests/unit/routes/projects.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create"
```

### Increase Timeout
```typescript
jest.setTimeout(30000); // 30 seconds
```

---

## 📊 Coverage

### View Coverage Report
```bash
npm test -- --coverage
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

### Coverage Thresholds
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## 🛠️ Common Patterns

### Test Database Operations
```typescript
import { getDatabase } from '../../src/database/sqlite';

const db = getDatabase();
const result = await db.query('SELECT * FROM projects');
expect(result.rows).toBeDefined();
```

### Mock External Services
```typescript
jest.mock('../../src/services/llm', () => ({
  default: {
    enhanceNote: jest.fn().mockResolvedValue({
      success: true,
      data: 'mocked response'
    })
  }
}));
```

### Test Error Handling
```typescript
await expect(
  someFunction(invalidData)
).rejects.toThrow('Expected error');
```

---

## 📁 Test Files Location

```
backend/tests/
├── unit/
│   ├── database/     # Database tests
│   ├── routes/       # API route tests
│   └── services/     # Service tests
├── integration/      # Integration tests
└── helpers/          # Test utilities
```

---

## ✅ Pre-Commit Checklist

- [ ] All tests pass: `npm test`
- [ ] Coverage maintained: `npm test -- --coverage`
- [ ] No console errors
- [ ] Tests are isolated
- [ ] Descriptive test names

---

## 🐛 Troubleshooting

### Tests Timeout
```typescript
jest.setTimeout(30000);
```

### Database Locked
```typescript
afterEach(async () => {
  await clearDatabase();
});
```

### Mock Not Working
```typescript
// Define mock BEFORE import
jest.mock('../../src/services/llm');
import llmService from '../../src/services/llm';
```

---

## 📚 Documentation

- **Full Guide**: `backend/TESTING.md`
- **Test Suite README**: `backend/tests/README.md`
- **Summary**: `TESTING_SUMMARY.md`

---

## 🎯 Quick Tips

1. **Run tests before committing**
2. **Write tests for new features**
3. **Test edge cases**
4. **Keep tests simple and focused**
5. **Use descriptive test names**
6. **Mock external dependencies**
7. **Clean up after tests**

---

**Happy Testing!** 🧪

