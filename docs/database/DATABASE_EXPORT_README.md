# Database Export File

## database_export.sql

This file contains a **snapshot export** of the database from October 2025, created during the PostgreSQL to SQLite migration process.

### Contents

- 6 active projects with full details
- 47 notes with project updates
- 30 todos across projects
- 27 milestones with dates
- Settings and configuration
- User preferences

### Purpose

This file was used to:
1. **Restore data** after container rebuild (✅ Completed)
2. **Serve as a backup** of the database state
3. **Provide reference** for the data structure

### Current Status

✅ **Data has been imported** into the active database at `backend/data/progress_tracker.db`

### Using This File

**If you need to restore from this export:**

```bash
# Stop the backend container first
docker-compose stop backend

# The file contains CREATE TABLE statements, so you'd need a fresh database
# It's recommended to use regular backups instead (see DATABASE.md)
```

**Better alternatives for backup/restore:**
- Use the automated backup scripts: `backup.sh` or `backup.bat`
- Backups are stored in `backend/data/backups/` and `backups/`
- See [`DATABASE.md`](DATABASE.md) for complete backup/restore procedures

### Note

This export file uses some PostgreSQL-specific syntax (`unistr()` functions) that requires processing before importing into SQLite. The active database already contains all this data, so this file is primarily kept as a reference.

For current database operations, refer to [`DATABASE.md`](DATABASE.md).