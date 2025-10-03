#!/bin/bash
# Progress Tracker Database Backup Script

set -e  # Exit on error

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="progress_tracker_backup_${TIMESTAMP}.db"
CONTAINER_NAME="progress-tracker-backend"

echo "🔄 Starting backup process..."

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container ${CONTAINER_NAME} is not running"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Copy database from container
echo "📦 Copying database from container..."
docker cp "${CONTAINER_NAME}:/app/data/progress_tracker.db" "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   File: $BACKUP_DIR/$BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
else
    echo "❌ Error: Backup file was not created"
    exit 1
fi

# Keep only last 10 backups
echo "🧹 Cleaning up old backups (keeping last 10)..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/progress_tracker_backup_*.db 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt 10 ]; then
    ls -t "$BACKUP_DIR"/progress_tracker_backup_*.db | tail -n +11 | xargs rm -f
    REMOVED=$((BACKUP_COUNT - 10))
    echo "   Removed $REMOVED old backup(s)"
else
    echo "   No cleanup needed (total backups: $BACKUP_COUNT)"
fi

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lht "$BACKUP_DIR"/progress_tracker_backup_*.db 2>/dev/null | head -5 | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo "✅ Backup complete!"

