# VS Code Testing Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Issue 1: "jest is not recognized as an internal or external command"

**Symptoms:**
```
'jest' is not recognized as an internal or external command,
operable program or batch file.
```

**Solutions:**

#### Solution A: Install Dependencies First ✅
```bash
cd backend
npm install
```

Then reload VS Code:
- Press `Ctrl+Shift+P`
- Type "Reload Window"
- Press Enter

#### Solution B: Verify Jest Installation
```bash
cd backend
npm list jest
```

Should show:
```
progress-tracker-backend@1.0.0
└── jest@29.7.0
```

If not installed:
```bash
cd backend
npm install
```

#### Solution C: Check VS Code Settings

The `.vscode/settings.json` should have:
```json
{
  "jest.jestCommandLine": "node_modules/.bin/jest",
  "jest.rootPath": "backend"
}
```

This is already configured in your workspace.

---

### Issue 2: Tests Not Showing in Test Explorer

**Symptoms:**
- Test Explorer is empty
- No tests appear in the sidebar

**Solutions:**

#### Solution A: Reload Jest Extension
1. Press `Ctrl+Shift+P`
2. Type "Jest: Start All Runners"
3. Press Enter

Or:
1. Press `Ctrl+Shift+P`
2. Type "Jest: Stop All Runners"
3. Then "Jest: Start All Runners"

#### Solution B: Check Jest Extension is Installed
1. Press `Ctrl+Shift+X` (Extensions)
2. Search for "Jest"
3. Install "Jest" by Orta if not installed

#### Solution C: Verify Test Files Exist
```bash
cd backend
ls tests/unit/routes/
```

Should show test files like `projects.test.ts`

#### Solution D: Check Output Panel
1. View → Output (or `Ctrl+Shift+U`)
2. Select "Jest" from the dropdown
3. Look for error messages

---

### Issue 3: "Cannot find module" Errors

**Symptoms:**
```
Cannot find module '@jest/globals'
Cannot find module 'supertest'
```

**Solution:**
```bash
cd backend
npm install
```

Make sure all dependencies are installed.

---

### Issue 4: Tests Run from Terminal but Not VS Code

**Solution:**

1. **Reload VS Code Window:**
   - `Ctrl+Shift+P` → "Reload Window"

2. **Check Jest Extension Settings:**
   - Open Settings (`Ctrl+,`)
   - Search for "jest"
   - Verify "Jest: Root Path" is set to "backend"

3. **Manually Start Jest:**
   - `Ctrl+Shift+P` → "Jest: Start All Runners"

4. **Check Working Directory:**
   - The Jest extension should run from the `backend` folder
   - This is configured in `.vscode/settings.json`

---

### Issue 5: Code Lens Not Showing "Run | Debug" Links

**Symptoms:**
- No "Run" or "Debug" links above tests
- Tests exist but no inline controls

**Solutions:**

#### Solution A: Enable Code Lens
1. Open Settings (`Ctrl+,`)
2. Search for "code lens"
3. Ensure "Editor: Code Lens" is enabled

#### Solution B: Check Jest Extension Status
1. Look at the bottom status bar
2. Should see "Jest" indicator
3. Click it to see status

#### Solution C: Restart Jest
- `Ctrl+Shift+P` → "Jest: Stop All Runners"
- `Ctrl+Shift+P` → "Jest: Start All Runners"

---

### Issue 6: Debugging Not Working

**Symptoms:**
- Breakpoints not hit
- Debug doesn't start

**Solutions:**

#### Solution A: Use Correct Debug Configuration
1. Open Debug panel (`Ctrl+Shift+D`)
2. Select "Jest: Debug Current File" from dropdown
3. Open a test file
4. Press F5

#### Solution B: Set Breakpoints in Test Files
- Breakpoints work best in `.test.ts` files
- Also works in source files being tested

#### Solution C: Use "Debug" Code Lens
- Click "Debug" link above a test
- This is the easiest way to debug

---

### Issue 7: Watch Mode Not Working

**Symptoms:**
- Tests don't re-run when files change
- Watch icon doesn't work

**Solutions:**

#### Solution A: Use Task Instead
1. `Ctrl+Shift+P`
2. "Tasks: Run Task"
3. Select "npm: test:watch"

#### Solution B: Use Debug Configuration
1. `Ctrl+Shift+D`
2. Select "Jest: Watch All Tests"
3. Press F5

#### Solution C: Use Terminal
```bash
cd backend
npm run test:watch
```

---

### Issue 8: Coverage Not Showing

**Symptoms:**
- Coverage report not generated
- Coverage gutters not showing

**Solutions:**

#### Solution A: Run Tests with Coverage
```bash
cd backend
npm test -- --coverage
```

Or use task:
1. `Ctrl+Shift+P`
2. "Tasks: Run Task"
3. "npm: test with coverage"

#### Solution B: Install Coverage Gutters Extension
```bash
code --install-extension ryanluker.vscode-coverage-gutters
```

Then click "Watch" in the status bar.

#### Solution C: Open Coverage Report
```bash
cd backend
start coverage/lcov-report/index.html
```

Or use task: "Open Coverage Report"

---

### Issue 9: Tests Timeout

**Symptoms:**
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solutions:**

#### Solution A: Increase Timeout in Test
```typescript
test('long running test', async () => {
  // test code
}, 30000); // 30 second timeout
```

#### Solution B: Increase Global Timeout
In `jest.config.js`:
```javascript
module.exports = {
  testTimeout: 30000, // 30 seconds
  // ... other config
};
```

---

### Issue 10: "Cannot use import statement outside a module"

**Symptoms:**
```
SyntaxError: Cannot use import statement outside a module
```

**Solution:**

This should already be configured in `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // ...
};
```

If still having issues:
```bash
cd backend
npm install --save-dev ts-jest @types/jest
```

---

## 🚀 Quick Fixes Checklist

Try these in order:

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Reload VS Code:**
   - `Ctrl+Shift+P` → "Reload Window"

3. **Restart Jest:**
   - `Ctrl+Shift+P` → "Jest: Stop All Runners"
   - `Ctrl+Shift+P` → "Jest: Start All Runners"

4. **Check Jest Extension is installed:**
   - `Ctrl+Shift+X` → Search "Jest" → Install

5. **Verify tests work from terminal:**
   ```bash
   cd backend
   npm test
   ```

6. **Check Output panel:**
   - View → Output → Select "Jest"

---

## 🔍 Diagnostic Commands

### Check Jest Installation
```bash
cd backend
npm list jest
```

### Check Test Files
```bash
cd backend
ls tests/unit/routes/
```

### Run Tests Manually
```bash
cd backend
npm test
```

### Check Jest Version
```bash
cd backend
npm test -- --version
```

### Verify Node Version
```bash
node --version
```
Should be 18.x or 20.x

---

## 📝 Alternative: Use Terminal Instead

If VS Code integration isn't working, you can always use the terminal:

### Run All Tests
```bash
cd backend
npm test
```

### Watch Mode
```bash
cd backend
npm run test:watch
```

### Run Specific File
```bash
cd backend
npm test -- tests/unit/routes/projects.test.ts
```

### With Coverage
```bash
cd backend
npm test -- --coverage
```

### Using Test Runner Scripts
```bash
cd backend
./run-tests.sh all          # Linux/Mac
run-tests.bat all           # Windows
```

---

## 🆘 Still Having Issues?

### Check Jest Extension Output
1. View → Output (`Ctrl+Shift+U`)
2. Select "Jest" from dropdown
3. Look for error messages

### Check VS Code Settings
1. File → Preferences → Settings (`Ctrl+,`)
2. Search for "jest"
3. Verify settings match `.vscode/settings.json`

### Verify File Structure
```
backend/
├── node_modules/          ← Should exist after npm install
├── tests/
│   ├── unit/
│   │   └── routes/
│   │       └── *.test.ts  ← Test files
│   └── setup.ts
├── jest.config.js         ← Jest configuration
└── package.json           ← Dependencies
```

### Check Package.json Scripts
Should have:
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

---

## ✅ Working Configuration

Your workspace should have:

- ✅ `.vscode/settings.json` - Jest configuration
- ✅ `.vscode/launch.json` - Debug configurations
- ✅ `.vscode/tasks.json` - Test tasks
- ✅ `backend/jest.config.js` - Jest config
- ✅ `backend/node_modules/` - Dependencies installed
- ✅ `backend/tests/` - Test files

---

## 📚 Additional Resources

- [Jest Extension Documentation](https://github.com/jest-community/vscode-jest)
- [VS Code Testing Documentation](https://code.visualstudio.com/docs/editor/testing)
- [Main Testing Guide](backend/TESTING.md)
- [VS Code Testing Guide](VSCODE_TESTING_GUIDE.md)

---

**Most issues are solved by:**
1. Running `npm install` in the backend directory
2. Reloading VS Code window
3. Restarting the Jest extension

Good luck! 🍀

