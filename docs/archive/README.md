# Archived Database Documentation

This directory contains historical database documentation that has been superseded by the consolidated [`DATABASE.md`](../../DATABASE.md) guide in the project root.

## Archived Files

### SQLITE_MIGRATION.md
- **Created:** During PostgreSQL to SQLite migration
- **Purpose:** Document the migration from PostgreSQL to SQLite
- **Status:** Historical reference - migration is complete
- **Superseded by:** [DATABASE.md](../../DATABASE.md)

### DATA_PERSISTENCE_GUIDE.md
- **Created:** To explain Docker data persistence
- **Purpose:** Document Docker volumes and persistence strategies
- **Issue:** Incorrectly assumed named volumes instead of actual bind mount
- **Superseded by:** [DATABASE.md](../../DATABASE.md) - Persistence section

### BACKUP_README.md
- **Created:** To document backup procedures
- **Purpose:** Comprehensive backup and restore guide
- **Status:** Content integrated into consolidated guide
- **Superseded by:** [DATABASE.md](../../DATABASE.md) - Backup sections

### DATABASE_RESTORE_GUIDE.md
- **Created:** 2025-10-06
- **Purpose:** Restore from database_export.sql and explain Tailscale access
- **Issue:** Significant overlap with other guides
- **Superseded by:** [DATABASE.md](../../DATABASE.md) - Restore sections

### DATABASE_DOCUMENTATION_TIMELINE.md
- **Created:** 2025-10-06
- **Purpose:** Analysis of documentation evolution and redundancies
- **Status:** Analysis document showing the consolidation process
- **Note:** Useful for understanding why consolidation was necessary

## Current Documentation

All database-related information is now in:
**[DATABASE.md](../../DATABASE.md)** - Complete database management guide

This single document covers:
- ✅ Database location and technology
- ✅ Restore from SQL export
- ✅ Backup procedures (manual and automated)
- ✅ Restore from backups
- ✅ Data persistence through Docker
- ✅ Tailscale network access
- ✅ Troubleshooting
- ✅ Maintenance and optimization

## Why These Were Archived

1. **Redundancy:** Multiple documents covering the same topics
2. **Inconsistencies:** Contradictory information about Docker configuration
3. **Fragmentation:** Information scattered across 5+ files
4. **Confusion:** Users unsure which guide to follow

## Restoration

If you need to reference the original documents, they are preserved here with their complete content intact.