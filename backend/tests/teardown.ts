/**
 * Global test teardown
 * Runs after all tests complete
 */

import { getDatabase } from "../src/database/sqlite";
import fs from "fs";
import path from "path";

module.exports = async () => {
  try {
    let dbClosed = false;
    try {
      const db = getDatabase();
      db.close();
      dbClosed = true;
    } catch (error: any) {
      if (error?.message?.includes("Database not initialized")) {
        console.log("INFO  Database was not initialized, skipping close");
      } else {
        console.log("INFO  Database connection already closed or unavailable");
      }
    }

    const removeIfExists = (filePath: string) => {
      if (!fs.existsSync(filePath)) {
        return;
      }

      try {
        fs.unlinkSync(filePath);
      } catch (error: any) {
        if (error?.code === "EBUSY" || error?.code === "EPERM") {
          const reason = dbClosed
            ? "file is still locked"
            : "database connection may still be open";
          console.warn(`INFO  Skipping removal of ${filePath} because ${reason}.`);
        } else {
          throw error;
        }
      }
    };

    const testDbPath = path.join(__dirname, "../data/test_progress_tracker.db");
    removeIfExists(testDbPath);
    removeIfExists(`${testDbPath}-wal`);
    removeIfExists(`${testDbPath}-shm`);

    console.log("Test cleanup complete");
  } catch (error) {
    console.error("Error during test cleanup:", error);
  }
};
