# VS Code Configuration for Progress Tracker

## 📁 Files in This Directory

### `settings.json`
Workspace settings including:
- Jest test configuration
- TypeScript settings
- File associations
- Search exclusions
- Test Explorer configuration

### `launch.json`
Debug configurations:
- **Jest: Run All Tests** - Run all tests with debugging
- **Jest: Run Current File** - Run tests in the current file
- **Jest: Debug Current File** - Debug tests in the current file
- **Jest: Watch All Tests** - Run tests in watch mode
- **Jest: Run with Coverage** - Run tests with coverage report
- **Backend: Start Server** - Start the backend server

### `tasks.json`
Task definitions:
- **npm: test** - Run all tests (default test task)
- **npm: test:watch** - Run tests in watch mode
- **npm: test:unit** - Run only unit tests
- **npm: test:integration** - Run only integration tests
- **npm: test with coverage** - Run tests with coverage
- **npm: build** - Build TypeScript (default build task)
- **Open Coverage Report** - Open the coverage report in browser

### `extensions.json`
Recommended extensions for this workspace:
- Jest extension for testing
- ESLint and Prettier for code quality
- Docker extension
- SQLite viewers
- GitLens for Git integration

---

## 🚀 Quick Start

### 1. Install Recommended Extensions

When you open this workspace, VS Code will prompt you to install recommended extensions.

Or manually:
1. Press `Ctrl+Shift+P`
2. Type "Extensions: Show Recommended Extensions"
3. Click "Install All"

### 2. Open Test Explorer

1. Click the Testing icon (🧪) in the Activity Bar (left sidebar)
2. You'll see all your tests organized by file
3. Click ▶️ to run tests

### 3. Run Tests

**From Test Explorer:**
- Click ▶️ next to any test, suite, or file

**From Editor:**
- Click "Run" or "Debug" links above tests (Code Lens)
- Right-click → "Run Tests" or "Debug Tests"

**From Command Palette:**
- `Ctrl+Shift+P` → "Jest: Run All Tests"

**From Debug Panel:**
- `Ctrl+Shift+D` → Select configuration → Press F5

**From Tasks:**
- `Ctrl+Shift+P` → "Tasks: Run Task" → Select test task

---

## 🐛 Debugging

### Quick Debug

1. Set breakpoints by clicking in the gutter (left of line numbers)
2. Click "Debug" link above a test (Code Lens)
3. Or press F5 with a debug configuration selected

### Debug Configurations

- **F5** - Start debugging with selected configuration
- **Ctrl+Shift+D** - Open Debug panel
- **F9** - Toggle breakpoint
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out

---

## ⚙️ Tasks

### Run Tasks

Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select:

- **npm: test** - Run all tests (Ctrl+Shift+B for default test task)
- **npm: test:watch** - Watch mode
- **npm: test:unit** - Unit tests only
- **npm: test:integration** - Integration tests only
- **npm: test with coverage** - With coverage report
- **npm: build** - Build TypeScript
- **Open Coverage Report** - View coverage in browser

---

## 📊 Coverage

### Generate Coverage

1. Run task: "npm: test with coverage"
2. Run task: "Open Coverage Report"

Or use debug configuration: "Jest: Run with Coverage"

### View Coverage in Editor

Install **Coverage Gutters** extension:
```bash
code --install-extension ryanluker.vscode-coverage-gutters
```

Then click "Watch" in the status bar to see coverage inline.

---

## 💡 Tips

### Code Lens
The "Run | Debug" links above tests are the fastest way to run individual tests.

### Watch Mode
Enable watch mode for instant feedback while developing.

### Keyboard Shortcuts
Add custom shortcuts in `Preferences: Open Keyboard Shortcuts (JSON)`:

```json
[
  {
    "key": "ctrl+shift+t",
    "command": "testing.runAll"
  },
  {
    "key": "ctrl+shift+r",
    "command": "testing.reRunLastRun"
  }
]
```

### Test Output
View detailed output in the "Test Results" panel at the bottom.

---

## 🔧 Customization

### Modify Settings

Edit `.vscode/settings.json` to customize:
- Jest auto-run behavior
- Test Explorer settings
- Editor preferences

### Add Debug Configurations

Edit `.vscode/launch.json` to add custom debug configurations.

### Add Tasks

Edit `.vscode/tasks.json` to add custom tasks.

---

## 📚 Documentation

- [VS Code Testing Guide](../VSCODE_TESTING_GUIDE.md) - Comprehensive guide
- [Testing Documentation](../backend/TESTING.md) - Full testing guide
- [Quick Reference](../backend/TESTING_QUICK_REFERENCE.md) - Quick reference card

---

## ✅ Checklist

- [ ] Install recommended extensions
- [ ] Open Test Explorer (🧪 icon)
- [ ] Run all tests to verify setup
- [ ] Try debugging a test
- [ ] Run tests with coverage
- [ ] Set up keyboard shortcuts (optional)

---

**Everything is configured and ready to use!** 🚀

