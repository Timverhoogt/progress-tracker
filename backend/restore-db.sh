#!/bin/bash

# Database Restoration Script
# This script restores the SQLite database from the export file

DB_PATH="${SQLITE_DB_PATH:-./data/progress_tracker.db}"
EXPORT_FILE="../database_export.sql"

echo "🔄 Database Restoration Script"
echo "================================"
echo "Database path: $DB_PATH"
echo "Export file: $EXPORT_FILE"

# Check if export file exists
if [ ! -f "$EXPORT_FILE" ]; then
    echo "❌ Error: Export file not found at $EXPORT_FILE"
    exit 1
fi

# Backup existing database if it exists
if [ -f "$DB_PATH" ]; then
    BACKUP_PATH="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backing up existing database to: $BACKUP_PATH"
    cp "$DB_PATH" "$BACKUP_PATH"
fi

# Restore database from export
echo "📥 Restoring database from export file..."
sqlite3 "$DB_PATH" < "$EXPORT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    echo ""
    echo "Database statistics:"
    sqlite3 "$DB_PATH" "SELECT 'Projects: ' || COUNT(*) FROM projects; SELECT 'Notes: ' || COUNT(*) FROM notes; SELECT 'Todos: ' || COUNT(*) FROM todos;"
else
    echo "❌ Error: Database restoration failed"
    exit 1
fi