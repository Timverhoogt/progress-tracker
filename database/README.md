# ⚠️ DEPRECATED: PostgreSQL Database Files

This directory contains **legacy PostgreSQL configuration files** from when the application used PostgreSQL.

## Current Database System: SQLite

The application now uses **SQLite** for data storage. These PostgreSQL files are kept for historical reference only.

## Active Database Location

**Current database:** `backend/data/progress_tracker.db`

See the main [`DATABASE.md`](../DATABASE.md) in the project root for current database documentation.

## Files in This Directory

- `init.sql` - Old PostgreSQL initialization script (NOT USED)
- `pgadmin_servers.json` - Old pgAdmin configuration (NOT USED)

## Migration History

The application was migrated from PostgreSQL to SQLite to:
- Simplify deployment (no external database server needed)
- Improve single-user performance
- Enable easy data portability
- Reduce infrastructure complexity

These files may be archived or removed in a future cleanup.