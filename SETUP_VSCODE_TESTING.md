# ✅ VS Code Testing Setup - Quick Start

## 🎯 You're Almost Ready!

Dependencies are installed and VS Code is configured. Just follow these 3 steps:

---

## Step 1: Install Jest Extension

**Option A: Via Command Palette (Recommended)**
1. Press `Ctrl+Shift+P`
2. Type: `Extensions: Show Recommended Extensions`
3. Click **Install** on "Jest" by Orta

**Option B: Via Extensions Panel**
1. Press `Ctrl+Shift+X`
2. Search for "Jest"
3. Install "Jest" by Orta (orta.vscode-jest)

**Option C: Via Command Line**
```bash
code --install-extension orta.vscode-jest
```

---

## Step 2: Reload VS Code Window

After installing the extension:

1. Press `Ctrl+Shift+P`
2. Type: `Reload Window`
3. Press Enter

Or just close and reopen VS Code.

---

## Step 3: Open Test Explorer

1. Click the **Testing** icon (🧪 beaker) in the Activity Bar (left sidebar)
2. You should see your tests organized by file
3. Click ▶️ next to any test to run it

---

## 🎉 That's It!

You should now see:

### In Test Explorer (🧪 sidebar):
```
🧪 Tests
  ▶️ backend/tests
    ▶️ unit
      ▶️ database
        ▶️ sqlite.test.ts (18 tests)
        ▶️ backup.test.ts (12 tests)
      ▶️ routes
        ▶️ projects.test.ts (20 tests)
        ▶️ notes.test.ts (18 tests)
        ▶️ todos.test.ts (22 tests)
      ▶️ services
        ▶️ llm.test.ts (15 tests)
    ▶️ integration
      ▶️ api.test.ts (8 tests)
```

### In Your Test Files:
When you open a test file (e.g., `backend/tests/unit/routes/projects.test.ts`), you'll see:

```typescript
describe('Projects API', () => {
  // ← "Run | Debug" links appear here
  
  test('should create project', async () => {
    // ← And here
    // Your test code
  });
});
```

---

## 🚀 Quick Actions

### Run All Tests
- Click ▶️ at the top of Test Explorer
- Or: `Ctrl+Shift+P` → "Jest: Run All Tests"

### Run a Single Test
- Click "Run" above the test in your editor
- Or: Click ▶️ next to the test in Test Explorer

### Debug a Test
- Click "Debug" above the test in your editor
- Or: Click 🐛 next to the test in Test Explorer

### Watch Mode (Auto-run on changes)
- Click 👁️ in Test Explorer
- Tests will re-run when you save files

---

## 🐛 Troubleshooting

### If Tests Don't Appear:

1. **Restart Jest:**
   - `Ctrl+Shift+P` → "Jest: Stop All Runners"
   - `Ctrl+Shift+P` → "Jest: Start All Runners"

2. **Check Output:**
   - View → Output (`Ctrl+Shift+U`)
   - Select "Jest" from dropdown
   - Look for errors

3. **Verify Installation:**
   ```bash
   cd backend
   npm list jest
   ```
   Should show: `jest@29.7.0`

4. **See Full Troubleshooting Guide:**
   - Open `VSCODE_TESTING_TROUBLESHOOTING.md`

---

## 📚 Documentation

- **`VSCODE_TESTING_GUIDE.md`** - Complete VS Code testing guide
- **`VSCODE_TESTING_TROUBLESHOOTING.md`** - Troubleshooting guide
- **`backend/TESTING.md`** - Full testing documentation
- **`backend/TESTING_QUICK_REFERENCE.md`** - Quick reference card

---

## ✅ Verification Checklist

- [x] Dependencies installed (`npm install` completed)
- [ ] Jest extension installed
- [ ] VS Code window reloaded
- [ ] Test Explorer opened (🧪 icon)
- [ ] Tests visible in Test Explorer
- [ ] "Run | Debug" links visible in test files

---

## 🎯 Next Steps

Once you see tests in the Test Explorer:

1. **Run all tests** to verify everything works
2. **Try debugging** a test with breakpoints
3. **Enable watch mode** for TDD workflow
4. **View coverage** with the coverage task

---

## 💡 Pro Tips

### Keyboard Shortcuts
Add these to your keybindings for faster testing:

1. File → Preferences → Keyboard Shortcuts
2. Click the file icon (top right) to open JSON
3. Add:

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

### Status Bar
Look at the bottom status bar for Jest status:
- **Jest** indicator shows if Jest is running
- Click it for quick actions

### Test Output
View detailed test output:
- Terminal → Test Results panel
- Or: View → Output → Select "Jest"

---

## 🆘 Need Help?

If something isn't working:

1. Check **`VSCODE_TESTING_TROUBLESHOOTING.md`**
2. Verify tests work from terminal: `cd backend && npm test`
3. Check Jest extension output: View → Output → "Jest"

---

**You're all set! Happy testing!** 🧪✨

