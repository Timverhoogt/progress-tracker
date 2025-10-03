# Progress Tracker Frontend Testing Suite

## Overview

This testing suite provides comprehensive test coverage for the Progress Tracker frontend application using Jest and jsdom for browser environment simulation.

## Test Structure

```
tests/
├── setup.js                    # Global test configuration and mocks
├── README.md                   # This documentation file
├── mood/                       # Mood module tests
│   ├── mood.api.test.js       # API layer tests
│   ├── mood.ui.test.js        # UI layer tests
│   └── mood.controller.test.js # Controller layer tests
└── [other modules]/           # Tests for other feature modules
```

## Setup and Configuration

### Prerequisites

```bash
# Install test dependencies
npm install
```

### Test Environment

The test environment is configured with:

- **Jest**: Testing framework
- **jsdom**: Browser environment simulation
- **Mock APIs**: Comprehensive mocking for external dependencies
- **Custom Utilities**: Helper functions for DOM testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests for specific module
npm test -- mood

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- mood.api.test.js
```

## Test Categories

### Unit Tests

Test individual functions and methods in isolation:

- **API Methods**: Test data fetching and manipulation
- **UI Methods**: Test DOM rendering and event handling
- **Controller Methods**: Test business logic and coordination
- **Utility Functions**: Test helper functions

### Integration Tests

Test module interactions and data flow:

- **Module Communication**: Event system and cross-module interactions
- **API Integration**: Mock API calls with realistic responses
- **State Management**: Global state updates and propagation

### Mock Strategy

#### External Dependencies

- **Fetch API**: Mocked with jest.fn() for HTTP requests
- **LocalStorage**: Mocked with in-memory implementation
- **Chart.js**: Mocked to avoid canvas rendering in tests
- **DOM APIs**: Mocked for browser environment simulation

#### Internal Dependencies

- **Core Systems**: API client, state management, events, router
- **Utility Modules**: DOM helpers, formatters, validation
- **Component Modules**: Reusable UI components

## Writing Tests

### Test File Structure

```javascript
/**
 * Component Tests
 * Tests the ComponentName class functionality
 */

import { ComponentName } from '../../js/modules/component/component.js';

// Mock dependencies
jest.mock('../../js/utils/helper.js', () => ({
    HelperUtils: {
        helperMethod: jest.fn()
    }
}));

describe('ComponentName', () => {
    let component;
    let mockDependency;

    beforeEach(() => {
        // Setup mocks and instances
        mockDependency = {
            method: jest.fn()
        };

        component = new ComponentName(mockDependency);
        jest.clearAllMocks();
    });

    describe('methodName', () => {
        it('should perform expected behavior', () => {
            // Arrange
            const input = 'test input';
            const expected = 'expected output';

            // Act
            const result = component.methodName(input);

            // Assert
            expect(result).toBe(expected);
            expect(mockDependency.method).toHaveBeenCalledWith(input);
        });

        it('should handle edge cases', () => {
            // Test edge cases and error conditions
            expect(() => component.methodName(null)).toThrow();
        });
    });
});
```

### Testing Guidelines

#### 1. Test Naming

```javascript
// Good: Descriptive test names
it('should validate mood score between 1 and 10', () => { ... });
it('should render mood entries in chronological order', () => { ... });

// Bad: Vague test names
it('should work', () => { ... });
it('should handle data', () => { ... });
```

#### 2. Test Organization

```javascript
describe('MoodApi', () => {
    describe('getTodayMood', () => {
        it('should call API client method', async () => { ... });
        it('should handle API errors', async () => { ... });
    });

    describe('createMoodEntry', () => {
        it('should validate input data', async () => { ... });
        it('should create entry successfully', async () => { ... });
    });
});
```

#### 3. Mock Setup

```javascript
// Mock external dependencies
jest.mock('../../js/core/api.js', () => ({
    api: {
        mood: {
            getTodayMood: jest.fn(),
            createMoodEntry: jest.fn()
        }
    }
}));

// Mock utility functions
jest.mock('../../js/utils/format.js', () => ({
    TextUtils: {
        escapeHtml: jest.fn((str) => str)
    }
}));
```

#### 4. Assertions

```javascript
// Use appropriate matchers
expect(result).toBe(expectedValue);
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(apiCall).toHaveBeenCalledWith('correct-endpoint');
expect(error).toBeInstanceOf(CustomError);
expect(element).toBeInTheDocument();
```

## Coverage Requirements

### Minimum Coverage

- **Functions**: 80% coverage
- **Lines**: 75% coverage
- **Branches**: 70% coverage
- **Statements**: 75% coverage

### Critical Paths

High coverage required for:

- **API Error Handling**: Network failures, validation errors
- **User Input Validation**: Form data, user interactions
- **State Management**: Global state updates, event handling
- **Security**: Authentication, authorization

## Continuous Integration

### Test Pipeline

1. **Lint**: ESLint code quality checks
2. **Unit Tests**: All unit tests must pass
3. **Integration Tests**: Cross-module integration tests
4. **Coverage**: Minimum coverage thresholds
5. **Build**: Webpack production build

### CI Configuration

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build
```

## Debugging Tests

### Verbose Output

```bash
# Show detailed test output
npm test -- --verbose

# Show test timing
npm test -- --verbose --testNamePattern="slow test"
```

### Debug Individual Tests

```bash
# Add debug statements to test files
console.log('Debug value:', debugValue);

// Run specific test in debug mode
npm test -- mood.api.test.js --verbose
```

### Common Issues

#### 1. Async Test Timeouts

```javascript
// Set timeout for slow async operations
it('should handle slow API calls', async () => {
    // 10 second timeout for slow tests
}, 10000);
```

#### 2. DOM Not Found Errors

```javascript
// Ensure DOM elements are created before tests
beforeEach(() => {
    document.body.innerHTML = '<div id="test-element"></div>';
});
```

#### 3. Mock Function Not Called

```javascript
// Verify mock setup and expectations
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);

// Check if function is properly mocked
console.log('Mock calls:', mockFunction.mock.calls);
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clear mocks between tests
- Reset DOM state between tests

### 2. Descriptive Assertions

- Use descriptive error messages
- Test specific behaviors, not implementations
- Verify both success and failure paths

### 3. Mock Strategy

- Mock external dependencies
- Use real implementations for utility functions
- Avoid mocking the system under test

### 4. Test Data

- Use realistic test data
- Test edge cases and boundary conditions
- Include both valid and invalid inputs

## Extending the Test Suite

### Adding New Module Tests

1. Create test directory: `tests/[module-name]/`
2. Create test files: `[component].test.js`
3. Add mocks for dependencies
4. Update Jest configuration if needed

### Adding Integration Tests

1. Create integration test files
2. Mock external APIs and services
3. Test complete user workflows
4. Verify data flow between modules

### Performance Testing

1. Monitor test execution time
2. Optimize slow tests
3. Add performance assertions where critical

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
- [Testing Best Practices](https://testing-library.com/docs/guiding-principles)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) (for future React migration)

## Support

For testing-related issues:

1. Check console output for detailed error messages
2. Verify mock setup and expectations
3. Ensure test environment is properly configured
4. Review test isolation and cleanup
5. Check for async/await issues in test code

