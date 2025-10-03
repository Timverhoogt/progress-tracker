/**
 * Unit tests for Backup Service
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { getDatabase } from "../../../src/database/sqlite";
import BackupService from "../../../src/database/backup";
import { clearDatabase, createTestProject } from "../../helpers/test-utils";
import fs from "fs";
import path from "path";

describe("Backup Service", () => {
  const testBackupDir = path.join(__dirname, "../../data/test-backups");

  beforeEach(async () => {
    await clearDatabase();

    // Create test backup directory
    if (!fs.existsSync(testBackupDir)) {
      fs.mkdirSync(testBackupDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test backups
    if (fs.existsSync(testBackupDir)) {
      const files = fs.readdirSync(testBackupDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testBackupDir, file));
      });
      fs.rmdirSync(testBackupDir);
    }
  });

  describe("createBackup", () => {
    test("should create a backup file", async () => {
      // Create some test data
      await createTestProject({ name: "Backup Test Project" });

      // Create backup
      const backupPath = await BackupService.createBackup({
        backupPath: testBackupDir,
        includeTimestamp: false,
      });

      expect(backupPath).toBeDefined();
      expect(fs.existsSync(backupPath)).toBe(true);
    });

    test("should create backup with timestamp", async () => {
      const backupPath = await BackupService.createBackup({
        backupPath: testBackupDir,
        includeTimestamp: true,
      });

      expect(backupPath).toMatch(/progress_tracker_backup_.*\.db$/);
      expect(fs.existsSync(backupPath)).toBe(true);
    });

    test("should create backup directory if it does not exist", async () => {
      const newBackupDir = path.join(testBackupDir, "new-dir");

      const backupPath = await BackupService.createBackup({
        backupPath: newBackupDir,
      });

      expect(fs.existsSync(newBackupDir)).toBe(true);
      expect(fs.existsSync(backupPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
      fs.rmdirSync(newBackupDir);
    });

    test("should backup actual data", async () => {
      // Create test data
      const project = await createTestProject({ name: "Data Test" });

      // Create backup
      const backupPath = await BackupService.createBackup({
        backupPath: testBackupDir,
        includeTimestamp: false,
      });

      // Verify backup contains data
      const stats = fs.statSync(backupPath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe("restoreBackup", () => {
    test("should restore from backup file", async () => {
      // Create original data
      const originalProject = await createTestProject({ name: "Original" });

      // Create backup
      const backupPath = await BackupService.createBackup({
        backupPath: testBackupDir,
        includeTimestamp: false,
      });

      // Modify data
      const db = getDatabase();
      await db.query("UPDATE projects SET name = ? WHERE id = ?", [
        "Modified",
        originalProject.id,
      ]);

      // Verify modification
      const modifiedResult = await db.query(
        "SELECT name FROM projects WHERE id = ?",
        [originalProject.id]
      );
      expect(modifiedResult.rows[0].name).toBe("Modified");

      // Restore from backup
      await BackupService.restoreBackup(backupPath);

      // Verify restoration
      const restoredResult = await db.query(
        "SELECT name FROM projects WHERE id = ?",
        [originalProject.id]
      );
      expect(restoredResult.rows[0].name).toBe("Original");
    });

    test("should throw error for non-existent backup file", async () => {
      const fakePath = path.join(testBackupDir, "non-existent.db");

      await expect(BackupService.restoreBackup(fakePath)).rejects.toThrow();
    });
  });

  describe("exportToJSON", () => {
    test("should export database to JSON", async () => {
      // Create test data
      await createTestProject({ name: "Export Test" });

      // Export to JSON
      const jsonPath = path.join(testBackupDir, "export.json");
      await BackupService.exportToJSON(jsonPath);

      expect(fs.existsSync(jsonPath)).toBe(true);

      // Verify JSON content
      const jsonContent = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(jsonContent);

      expect(data).toHaveProperty("projects");
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.projects.length).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(jsonPath);
    });

    test("should export all tables", async () => {
      // Create various test data
      const project = await createTestProject();

      // Export
      const jsonPath = path.join(testBackupDir, "full-export.json");
      await BackupService.exportToJSON(jsonPath);

      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      // Check for expected tables
      expect(data).toHaveProperty("projects");
      expect(data).toHaveProperty("notes");
      expect(data).toHaveProperty("todos");
      expect(data).toHaveProperty("settings");

      // Cleanup
      fs.unlinkSync(jsonPath);
    });
  });

  describe("getStats", () => {
    test("should return database statistics", async () => {
      // Create test data
      await createTestProject({ name: "Stats Test 1" });
      await createTestProject({ name: "Stats Test 2" });

      const stats = (await BackupService.getStats()) as any;

      expect(stats).toHaveProperty("projects");
      expect(stats.projects).toBeGreaterThanOrEqual(2);
      expect(stats).toHaveProperty("notes");
      expect(stats).toHaveProperty("todos");
    });

    test("should return zero counts for empty database", async () => {
      await clearDatabase();

      const stats = (await BackupService.getStats()) as any;

      expect(stats.projects).toBe(0);
      expect(stats.notes).toBe(0);
      expect(stats.todos).toBe(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle backup to read-only location", async () => {
      // This test is platform-specific and may need adjustment
      // Skip on Windows where permissions work differently
      if (process.platform === "win32") {
        return;
      }

      const readOnlyDir = path.join(testBackupDir, "readonly");
      fs.mkdirSync(readOnlyDir, { recursive: true });
      fs.chmodSync(readOnlyDir, 0o444); // Read-only

      await expect(
        BackupService.createBackup({
          backupPath: readOnlyDir,
        })
      ).rejects.toThrow();

      // Cleanup
      fs.chmodSync(readOnlyDir, 0o755);
      fs.rmdirSync(readOnlyDir);
    });
  });
});
