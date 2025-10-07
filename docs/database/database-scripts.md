# Database Utility Scripts

## check-db.ts

A utility script to inspect the current database contents.

**Usage:**
```bash
cd backend
npx ts-node check-db.ts
```

**What it shows:**
- Count of rows in each table
- Sample data from key tables (projects, notes, todos, etc.)
- Current configuration and settings

**When to use:**
- After container rebuilds to verify data persistence
- To check if database restoration was successful
- To debug data-related issues

## Database Location

**Active Database:** `backend/data/progress_tracker.db`

This is the database file used by the Docker container:
- Mounted via: `./backend/data:/app/data` in docker-compose.yml
- Persists across container restarts and rebuilds
- Direct file access from host system

## Backups

Backups are stored in:
- `backend/data/backups/` - Container-created backups
- `backups/` - Root-level backup directory

Use the backup scripts:
- Linux/Mac: `./backup.sh`
- Windows: `backup.bat`

## Database Export

The `database_export.sql` file in the project root contains a snapshot of the database structure and data. See [`DATABASE_EXPORT_README.md`](DATABASE_EXPORT_README.md) for details.

## More Information

See [`DATABASE.md`](../../DATABASE.md) in the project root for comprehensive database management documentation.