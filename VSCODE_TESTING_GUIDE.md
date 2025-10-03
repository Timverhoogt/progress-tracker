# VS Code Testing Guide

## 🎯 Overview

Your Progress Tracker project is now fully configured to use VS Code's built-in testing features with Jest!

---

## 📦 Required Extensions

### Install These Extensions (Recommended)

1. **Jest** by Orta
   - Extension ID: `orta.vscode-jest`
   - Provides inline test results, debugging, and more
   - [Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=orta.vscode-jest)

2. **Test Explorer UI** (Optional but helpful)
   - Extension ID: `hbenl.vscode-test-explorer`
   - Provides a unified test explorer view

### Quick Install

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac), type "Extensions: Show Recommended Extensions", and install the suggested extensions.

Or install via command line:
```bash
code --install-extension orta.vscode-jest
code --install-extension hbenl.vscode-test-explorer
```

---

## 🚀 Using VS Code Testing Features

### 1. **Test Explorer Sidebar**

- Click the **Testing** icon in the Activity Bar (left sidebar) - looks like a beaker 🧪
- You'll see all your tests organized by file
- Click the ▶️ play button next to any test to run it
- Click the 🔄 refresh button to reload tests

### 2. **Inline Test Results**

With the Jest extension installed, you'll see:
- ✅ Green checkmarks next to passing tests
- ❌ Red X marks next to failing tests
- ⏱️ Test execution time
- **Run** | **Debug** links above each test

### 3. **Run Tests from Editor**

**Option A: Code Lens (appears above tests)**
```typescript
describe('My Feature', () => {
  // You'll see "Run | Debug" links here ↑
  
  test('should work', () => {
    // And here ↑
    expect(true).toBe(true);
  });
});
```

**Option B: Right-click menu**
- Right-click in a test file
- Select "Run Tests" or "Debug Tests"

**Option C: Command Palette**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
- Type "Jest: Run All Tests"

### 4. **Keyboard Shortcuts**

You can add these to your `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+t",
    "command": "testing.runAll"
  },
  {
    "key": "ctrl+shift+r",
    "command": "testing.reRunLastRun"
  },
  {
    "key": "ctrl+shift+d",
    "command": "testing.debugLastRun"
  }
]
```

---

## 🐛 Debugging Tests

### Method 1: Using Code Lens

1. Click **Debug** link above any test
2. Breakpoints will be hit automatically
3. Use the Debug toolbar to step through code

### Method 2: Using Debug Panel

1. Open the **Run and Debug** panel (Ctrl+Shift+D)
2. Select a debug configuration from the dropdown:
   - **Jest: Run All Tests** - Debug all tests
   - **Jest: Debug Current File** - Debug the open test file
   - **Jest: Run with Coverage** - Run with coverage
3. Press F5 or click the green play button

### Method 3: Breakpoints

1. Set breakpoints by clicking in the gutter (left of line numbers)
2. Right-click in test file → "Debug Tests"
3. Execution will pause at breakpoints

### Debug Features Available

- **Step Over** (F10) - Execute current line
- **Step Into** (F11) - Step into function calls
- **Step Out** (Shift+F11) - Step out of current function
- **Continue** (F5) - Continue to next breakpoint
- **Variables** - Inspect variable values
- **Watch** - Add expressions to watch
- **Call Stack** - See the execution path

---

## 📊 Coverage in VS Code

### View Coverage

1. Run tests with coverage:
   - Command Palette → "Tasks: Run Task" → "npm: test with coverage"
   - Or use the debug configuration "Jest: Run with Coverage"

2. Open the coverage report:
   - Command Palette → "Tasks: Run Task" → "Open Coverage Report"
   - Or manually open `backend/coverage/lcov-report/index.html`

### Coverage Gutters (with Extension)

Install **Coverage Gutters** extension:
```bash
code --install-extension ryanluker.vscode-coverage-gutters
```

Then:
- Run tests with coverage
- Click "Watch" in the status bar
- See coverage indicators in the gutter:
  - 🟢 Green = Covered
  - 🔴 Red = Not covered
  - 🟡 Yellow = Partially covered

---

## 🎨 Test Explorer Features

### Filter Tests

In the Test Explorer sidebar:
- Click the filter icon (funnel)
- Options:
  - Show only failed tests
  - Show only passed tests
  - Hide passed tests

### Run Specific Tests

- **Single test**: Click ▶️ next to the test
- **Test suite**: Click ▶️ next to the describe block
- **File**: Click ▶️ next to the file name
- **All tests**: Click ▶️ at the top

### Watch Mode

- Click the 👁️ watch icon in Test Explorer
- Tests will re-run automatically when files change

---

## ⚙️ Configuration Files Created

### `.vscode/settings.json`
- Jest configuration
- Test Explorer settings
- File associations
- Search exclusions

### `.vscode/launch.json`
- Debug configurations for tests
- Run configurations
- Server debug config

### `.vscode/tasks.json`
- Test tasks (run, watch, coverage)
- Build tasks
- Open coverage report task

### `.vscode/extensions.json`
- Recommended extensions
- Auto-suggests on workspace open

---

## 🔧 Common Tasks

### Run All Tests
- **Test Explorer**: Click ▶️ at the top
- **Command Palette**: `Jest: Run All Tests`
- **Task**: `Ctrl+Shift+P` → "Tasks: Run Task" → "npm: test"
- **Keyboard**: `Ctrl+Shift+T` (if configured)

### Run Current File Tests
- **Code Lens**: Click "Run" above describe block
- **Debug Config**: Select "Jest: Run Current File" and press F5
- **Right-click**: In test file → "Run Tests"

### Run Single Test
- **Code Lens**: Click "Run" above the test
- **Test Explorer**: Click ▶️ next to the test name

### Watch Mode
- **Test Explorer**: Click 👁️ watch icon
- **Task**: Run task "npm: test:watch"
- **Debug Config**: Select "Jest: Watch All Tests"

### Debug Failing Test
- **Test Explorer**: Click 🐛 debug icon next to failed test
- **Code Lens**: Click "Debug" above the test
- **Right-click**: In test file → "Debug Tests"

### View Coverage
1. Run task "npm: test with coverage"
2. Run task "Open Coverage Report"
3. Or manually open `backend/coverage/lcov-report/index.html`

---

## 💡 Pro Tips

### 1. **Use Code Lens**
The "Run | Debug" links above tests are the fastest way to run individual tests.

### 2. **Watch Mode for TDD**
Enable watch mode while developing to get instant feedback on test results.

### 3. **Breakpoint Debugging**
Set breakpoints in your source code (not just tests) to debug the actual implementation.

### 4. **Test Explorer Filters**
Use filters to focus on failing tests when fixing bugs.

### 5. **Keyboard Shortcuts**
Set up keyboard shortcuts for common test operations to speed up your workflow.

### 6. **Coverage Gutters**
Install the Coverage Gutters extension to see coverage inline in your code.

### 7. **Auto-Run Tests**
You can enable auto-run in settings:
```json
{
  "jest.autoRun": "watch"
}
```

### 8. **Test Output**
View detailed test output in the "Test Results" panel at the bottom.

---

## 🎯 Workflow Examples

### Test-Driven Development (TDD)

1. Open test file and source file side-by-side
2. Enable watch mode (👁️ in Test Explorer)
3. Write a failing test
4. Watch it fail (red ❌)
5. Implement the feature
6. Watch it pass (green ✅)
7. Refactor with confidence

### Debugging a Failing Test

1. Find the failing test in Test Explorer (red ❌)
2. Click the 🐛 debug icon next to it
3. Set breakpoints in the source code
4. Step through to find the issue
5. Fix the code
6. Re-run to verify (green ✅)

### Running Tests Before Commit

1. Click ▶️ at the top of Test Explorer
2. Wait for all tests to pass
3. Check coverage if needed
4. Commit with confidence

---

## 🐛 Troubleshooting

### Tests Not Showing Up

1. Make sure Jest extension is installed
2. Reload VS Code window: `Ctrl+Shift+P` → "Reload Window"
3. Check that `backend/jest.config.js` exists
4. Verify `backend/node_modules` is installed

### Tests Not Running

1. Check the Output panel: View → Output → Select "Jest" from dropdown
2. Verify Jest is installed: `cd backend && npm list jest`
3. Try running from terminal: `cd backend && npm test`

### Debugging Not Working

1. Make sure you're using the correct debug configuration
2. Check that source maps are enabled in `jest.config.js`
3. Try "Debug Current File" instead of "Debug All Tests"

### Coverage Not Showing

1. Run tests with coverage first
2. Check that `backend/coverage/lcov.info` exists
3. Install Coverage Gutters extension
4. Click "Watch" in the status bar

---

## 📚 Additional Resources

- [VS Code Testing Documentation](https://code.visualstudio.com/docs/editor/testing)
- [Jest Extension Documentation](https://github.com/jest-community/vscode-jest)
- [Jest Documentation](https://jestjs.io/)

---

## ✅ Quick Checklist

- [ ] Install Jest extension (`orta.vscode-jest`)
- [ ] Install Test Explorer UI (optional)
- [ ] Open Test Explorer sidebar (beaker icon 🧪)
- [ ] Run all tests to verify setup
- [ ] Try debugging a test
- [ ] Enable watch mode
- [ ] Set up keyboard shortcuts (optional)
- [ ] Install Coverage Gutters (optional)

---

**Happy Testing in VS Code!** 🧪✨

