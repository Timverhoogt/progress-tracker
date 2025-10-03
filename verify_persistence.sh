#!/bin/bash
# Verify Data Persistence Setup

echo "=========================================="
echo "📊 Data Persistence Verification"
echo "=========================================="
echo ""

# Check if containers are running
echo "1️⃣  Checking containers..."
if docker ps --format '{{.Names}}' | grep -q "progress-tracker-backend"; then
    echo "   ✅ Backend container is running"
else
    echo "   ❌ Backend container is NOT running"
    exit 1
fi

# Check Docker volume
echo ""
echo "2️⃣  Checking Docker volume..."
if docker volume ls | grep -q "progress-tracker_sqlite_data"; then
    echo "   ✅ Volume 'progress-tracker_sqlite_data' exists"
    
    # Get volume details
    VOLUME_INFO=$(docker volume inspect progress-tracker_sqlite_data --format '{{.Mountpoint}}')
    echo "   📁 Location: $VOLUME_INFO"
else
    echo "   ❌ Volume 'progress-tracker_sqlite_data' NOT found"
    exit 1
fi

# Check database in container
echo ""
echo "3️⃣  Checking database files..."
DB_FILES=$(docker exec progress-tracker-backend sh -c "ls -lh /app/data/" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Database files found:"
    echo "$DB_FILES" | grep -E "\.db" | while read -r line; do
        echo "      $line"
    done
else
    echo "   ❌ Cannot access database files"
    exit 1
fi

# Get database size
echo ""
echo "4️⃣  Database statistics..."
DB_SIZE=$(docker exec progress-tracker-backend du -sh /app/data/progress_tracker.db 2>/dev/null | cut -f1)
if [ $? -eq 0 ]; then
    echo "   📊 Database size: $DB_SIZE"
else
    echo "   ⚠️  Cannot determine database size"
fi

# Count records (if sqlite3 is available in container)
echo ""
echo "5️⃣  Data verification..."
PROJECTS=$(docker exec progress-tracker-backend sh -c "cd /app && node -e \"const db = require('./dist/database/sqlite').getDatabase(); const result = db.query('SELECT COUNT(*) as count FROM projects'); console.log(result.rows[0].count);\"" 2>/dev/null)
NOTES=$(docker exec progress-tracker-backend sh -c "cd /app && node -e \"const db = require('./dist/database/sqlite').getDatabase(); const result = db.query('SELECT COUNT(*) as count FROM notes'); console.log(result.rows[0].count);\"" 2>/dev/null)
TODOS=$(docker exec progress-tracker-backend sh -c "cd /app && node -e \"const db = require('./dist/database/sqlite').getDatabase(); const result = db.query('SELECT COUNT(*) as count FROM todos'); console.log(result.rows[0].count);\"" 2>/dev/null)

if [ ! -z "$PROJECTS" ]; then
    echo "   📋 Projects: $PROJECTS"
    echo "   📝 Notes: $NOTES"
    echo "   ✅ Todos: $TODOS"
else
    echo "   ⚠️  Cannot query database (this is OK)"
fi

# Check backups
echo ""
echo "6️⃣  Backup status..."
if [ -d "./backups" ]; then
    BACKUP_COUNT=$(ls -1 ./backups/progress_tracker_backup_*.db 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo "   ✅ Found $BACKUP_COUNT backup(s)"
        echo "   📅 Most recent:"
        ls -lt ./backups/progress_tracker_backup_*.db 2>/dev/null | head -1 | awk '{print "      " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}'
    else
        echo "   ⚠️  No backups found (run ./backup.sh to create one)"
    fi
else
    echo "   ⚠️  Backup directory doesn't exist (run ./backup.sh to create)"
fi

echo ""
echo "=========================================="
echo "✅ Verification Complete!"
echo "=========================================="
echo ""
echo "📌 Summary:"
echo "   • Your data is stored in Docker volume: progress-tracker_sqlite_data"
echo "   • Data persists through container rebuilds and restarts"
echo "   • Database is safely mounted at: /app/data/"
echo ""
echo "🛡️  Data Safety:"
echo "   ✅ SAFE: docker-compose up -d --build"
echo "   ✅ SAFE: docker-compose restart"
echo "   ✅ SAFE: docker-compose down"
echo "   ❌ DANGER: docker-compose down -v (deletes volume!)"
echo ""
echo "💾 Backup Recommendation:"
echo "   Run './backup.sh' regularly to create backups"
echo ""

