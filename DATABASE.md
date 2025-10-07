# Progress Tracker Database Guide

Complete guide for database management, backups, and restoration.

---

## Quick Start

### Database Location
- **Host:** `backend/data/progress_tracker.db`
- **Docker Container:** `/app/data/progress_tracker.db`
- **Backups:** `backups/progress_tracker_backup_*.db`

### Current Setup ✅
Your database is configured for **automatic persistence** through Docker bind mount:
```yaml
volumes:
  - ./backend/data:/app/data
```

**This means:**
- ✅ Data survives container restarts, rebuilds, and updates
- ✅ Database file is directly accessible on your host computer
- ✅ Easy to backup (just copy the file)
- ✅ Works seamlessly with Tailscale network access

---

## Database Technology

### SQLite Local Storage
- **Single file** contains all your data
- **No external database** server required
- **Fast** for single-user applications
- **Portable** - copy the file to move your data

### Schema
- 30+ tables for projects, notes, todos, achievements, coaching, etc.
- UUID-based IDs for all records
- JSON fields for structured data
- Full-text search support

---

## Restore Database from Export

If you have `database_export.sql` and want to restore it:

### Quick Restore

**Linux/Mac:**
```bash
cd backend
npm run restore-db
```

**Windows (using Docker - recommended):**
```bash
cd backend
npm run restore-db:win
```

**Note:** The Windows script uses Docker to avoid requiring sqlite3 installation on your host system.

### Manual Restore

```bash
# From project root
sqlite3 backend/data/progress_tracker.db < database_export.sql
```

### Docker Container Restore

```bash
# Copy export file into container
docker cp database_export.sql progress-tracker-backend:/app/database_export.sql

# Execute restore
docker exec progress-tracker-backend sh -c "sqlite3 /app/data/progress_tracker.db < /app/database_export.sql"

# Verify
docker exec progress-tracker-backend sh -c "sqlite3 /app/data/progress_tracker.db 'SELECT COUNT(*) FROM projects;'"
```

---

## Backup Your Database

### Automatic Backups

**Linux/Mac:**
```bash
./backup.sh
```

**Windows:**
```bash
backup.bat
```

### Manual Backup

```bash
# Simple file copy
cp backend/data/progress_tracker.db backups/backup_$(date +%Y%m%d).db

# Or from Docker container
docker cp progress-tracker-backend:/app/data/progress_tracker.db ./backups/backup_$(date +%Y%m%d).db
```

### What the Backup Scripts Do

- Create timestamped backup files
- Store in `./backups/` directory
- Keep last 10 backups automatically
- Verify container is running
- Show backup size and list

**Backup filename format:**
```
progress_tracker_backup_YYYYMMDD_HHMMSS.db
```

---

## Restore from Backup

### Method 1: Running Containers

```bash
# Copy backup to container
docker cp ./backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db progress-tracker-backend:/app/data/progress_tracker.db

# Restart to reload database
docker-compose restart backend
```

### Method 2: Stopped Containers

```bash
# Stop containers
docker-compose down

# Copy backup to host directory
cp ./backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db backend/data/progress_tracker.db

# Start containers
docker-compose up -d
```

---

## Automated Backups

### Linux/Mac (Cron)

Edit crontab:
```bash
crontab -e
```

Add daily backup at 2 AM:
```cron
0 2 * * * cd /path/to/progress-tracker && ./backup.sh >> ./backups/backup.log 2>&1
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c "cd C:\path\to\progress-tracker && backup.bat"`
5. Save and test

---

## Data Persistence

### What Persists ✅

Your data **WILL survive**:
- Container restarts: `docker-compose restart`
- Container rebuilds: `docker-compose up -d --build`
- Container recreation: `docker-compose down && docker-compose up -d`
- Code updates and deployments

### What Deletes Data ❌

Your data **WILL BE LOST** if you:
- Delete the `backend/data` directory
- Use `docker-compose down -v` (the `-v` flag removes volumes)
- Manually delete the database file

### Safe Commands

```bash
# Safe - data persists
docker-compose up -d --build
docker-compose restart
docker-compose down
docker-compose stop/start

# DANGEROUS - deletes data
docker-compose down -v  # DON'T USE!
rm -rf backend/data     # DON'T DO THIS!
```

---

## Verify Database

### Check Database Exists

```bash
ls -lh backend/data/progress_tracker.db
```

### Check Database Contents

```bash
# Count projects
sqlite3 backend/data/progress_tracker.db "SELECT COUNT(*) FROM projects;"

# List projects
sqlite3 backend/data/progress_tracker.db "SELECT name FROM projects;"

# Get all table names
sqlite3 backend/data/progress_tracker.db ".tables"
```

### Check in Docker Container

```bash
# List files
docker exec progress-tracker-backend ls -lh /app/data/

# Check database size
docker exec progress-tracker-backend du -sh /app/data/progress_tracker.db
```

---

## Tailscale Network Access

Your database is accessible from other computers on your Tailscale network:

### How It Works

```
Remote Computer (100.x.x.x)
  → http://100.x.x.x:8082/api/projects
    → Nginx (frontend container, port 8082)
      → http://backend:3060/api/projects
        → Backend Container
          → SQLite DB (/app/data/progress_tracker.db)
            → Host File (./backend/data/progress_tracker.db)
```

### Verify Remote Access

From another computer on Tailscale:
```bash
# Replace 100.x.x.x with your Tailscale IP
curl http://100.x.x.x:8082/api/projects
```

### Troubleshooting Remote Access

If you can't access from remote computer:

1. **Check containers are running:**
   ```bash
   docker ps
   ```

2. **Test API directly:**
   ```bash
   curl http://localhost:8082/api/projects
   ```

3. **Check browser console (F12):**
   - Look for JavaScript errors
   - Check Network tab for failed requests

4. **Verify both containers are healthy:**
   ```bash
   docker ps --filter "name=progress-tracker"
   ```

---

## Deployment Workflow

Safe workflow for updating your app:

```bash
# 1. Create backup first
./backup.sh

# 2. Pull latest code
git pull origin main

# 3. Rebuild containers (data persists automatically)
docker-compose up -d --build

# 4. Check logs
docker-compose logs -f backend

# 5. Verify data is intact
docker exec progress-tracker-backend ls -lh /app/data/
```

---

## Troubleshooting

### Database Not Found

```bash
# Ensure directory exists
mkdir -p backend/data

# Check permissions
chmod 755 backend/data
```

### Sample Data Keeps Appearing

**Fixed!** Sample data insertion has been disabled in `backend/src/database/migrate.ts`.

If you see a project called "Original", it's from an old migration. Simply delete it or restore from your `database_export.sql`.

### Database Locked Error

```bash
# Stop backend container
docker-compose stop backend

# Perform operation (restore, copy, etc.)

# Start backend
docker-compose start backend
```

### Can't Access from Remote Computer

1. Verify containers are running: `docker ps`
2. Check Tailscale IP is correct
3. Test locally first: `curl http://localhost:8082/api/projects`
4. Check browser console for errors
5. Verify nginx proxy is working

---

## Export Database

### Create SQL Export

```bash
# Full database export
sqlite3 backend/data/progress_tracker.db .dump > database_export_$(date +%Y%m%d).sql
```

### Export to JSON

```bash
# Using sqlite3
sqlite3 backend/data/progress_tracker.db <<EOF
.mode json
.output export.json
SELECT * FROM projects;
.quit
EOF
```

---

## Cloud Backup Integration

### Google Drive (using rclone)

```bash
# Install and configure rclone first
# Then add to backup script:
rclone copy ./backups/ gdrive:progress-tracker-backups/
```

### Dropbox

```bash
# Install Dropbox CLI, then:
cp ./backups/progress_tracker_backup_*.db ~/Dropbox/progress-tracker-backups/
```

### Git (for small databases)

```bash
git add backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db
git commit -m "Database backup YYYYMMDD"
git push
```

**Note:** Only use Git if database is <100 MB and doesn't contain sensitive data.

---

## Database Maintenance

### Vacuum Database

Optimize database file size:
```bash
sqlite3 backend/data/progress_tracker.db "VACUUM;"
```

### Check Integrity

Verify database integrity:
```bash
sqlite3 backend/data/progress_tracker.db "PRAGMA integrity_check;"
```

### Analyze Database

Update table statistics:
```bash
sqlite3 backend/data/progress_tracker.db "ANALYZE;"
```

---

## Important Notes

1. **Sample Data Disabled:** Automatic sample data insertion is disabled to prevent overwrites
2. **Bind Mount:** Your setup uses a bind mount (not a named volume), giving you direct file access
3. **Backup Scripts:** Restore scripts automatically create backups before restoration
4. **Network Access:** Works seamlessly with Tailscale because nginx proxies `/api` to backend
5. **Data Safety:** Database persists through all normal Docker operations

---

## Quick Reference

### Essential Commands

```bash
# Backup
./backup.sh                    # Create backup

# Restore from SQL export
cd backend && npm run restore-db

# Restore from backup
docker cp ./backups/backup.db progress-tracker-backend:/app/data/progress_tracker.db
docker-compose restart backend

# Verify
sqlite3 backend/data/progress_tracker.db "SELECT COUNT(*) FROM projects;"

# Deploy
./backup.sh && docker-compose up -d --build
```

### File Locations

- **Database:** `backend/data/progress_tracker.db`
- **Backups:** `backups/progress_tracker_backup_*.db`
- **SQL Export:** `database_export.sql`
- **Backup Scripts:** `backup.sh`, `backup.bat`
- **Restore Scripts:** `backend/restore-db.sh`, `backend/restore-db.bat`

---

## Support

If you encounter issues:
1. Check container logs: `docker logs progress-tracker-backend`
2. Verify database file exists: `ls -lh backend/data/progress_tracker.db`
3. Test database directly: `sqlite3 backend/data/progress_tracker.db "SELECT 1;"`
4. Check Docker volumes: `docker inspect progress-tracker-backend`
5. Verify Tailscale connectivity from remote computer

**Your database is safe and will persist through all normal operations!** 🎉