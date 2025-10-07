# Database Backup System

## Quick Start

### Create a Backup

**Linux/Mac:**
```bash
./backup.sh
```

**Windows:**
```cmd
backup.bat
```

**Manual (any OS):**
```bash
docker cp progress-tracker-backend:/app/data/progress_tracker.db ./backups/backup_$(date +%Y%m%d).db
```

---

## Backup Scripts

### `backup.sh` (Linux/Mac)
- Automatically creates timestamped backups
- Keeps only the last 10 backups
- Shows backup size and recent backup list
- Verifies container is running before backup

### `backup.bat` (Windows)
- Same functionality as bash script
- Windows-compatible batch file
- Works with Git Bash or Command Prompt

---

## Backup Location

All backups are stored in:
```
./backups/
```

Backup filename format:
```
progress_tracker_backup_YYYYMMDD_HHMMSS.db
```

Example:
```
progress_tracker_backup_20251003_095923.db
```

---

## Restore from Backup

### Method 1: While Containers Are Running

```bash
# 1. Copy backup to container
docker cp ./backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db progress-tracker-backend:/app/data/progress_tracker.db

# 2. Restart backend to reload database
docker-compose restart backend
```

### Method 2: With Containers Stopped

```bash
# 1. Stop containers
docker-compose down

# 2. Start a temporary container to access the volume
docker run --rm -v progress-tracker_sqlite_data:/data -v $(pwd)/backups:/backup alpine sh -c "cp /backup/progress_tracker_backup_YYYYMMDD_HHMMSS.db /data/progress_tracker.db"

# 3. Start containers
docker-compose up -d
```

### Method 3: Replace Local Database (Development)

```bash
# Copy backup to local backend/data directory
cp ./backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db backend/data/progress_tracker.db

# Rebuild containers to use new database
docker-compose up -d --build
```

---

## Automated Backups

### Linux/Mac with Cron

Edit crontab:
```bash
crontab -e
```

Add one of these lines:

**Daily at 2 AM:**
```cron
0 2 * * * cd /path/to/progress-tracker && ./backup.sh >> ./backups/backup.log 2>&1
```

**Every 6 hours:**
```cron
0 */6 * * * cd /path/to/progress-tracker && ./backup.sh >> ./backups/backup.log 2>&1
```

**Weekly on Sunday at 3 AM:**
```cron
0 3 * * 0 cd /path/to/progress-tracker && ./backup.sh >> ./backups/backup.log 2>&1
```

### Windows with Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2:00 AM)
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c "cd C:\path\to\progress-tracker && backup.bat"`
5. Save and test

---

## Backup Best Practices

### 1. **Regular Backups**
- Run backups at least daily
- More frequent for active development
- Before major updates or changes

### 2. **Off-site Backups**
- Copy backups to cloud storage (Google Drive, Dropbox, etc.)
- Keep backups on a different machine
- Use git to version control database snapshots (if small enough)

### 3. **Test Restores**
- Periodically test restoring from backup
- Verify data integrity after restore
- Document restore procedures

### 4. **Backup Before:**
- Updating Docker containers
- Changing database schema
- Major code deployments
- System maintenance

---

## Backup Verification

### Check Backup Integrity

```bash
# Check if backup file exists and has content
ls -lh backups/progress_tracker_backup_*.db

# Verify backup is a valid SQLite database
sqlite3 backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db "SELECT COUNT(*) FROM projects;"
```

### Compare Backup with Current Database

```bash
# Get current database size
docker exec progress-tracker-backend du -sh /app/data/progress_tracker.db

# Get backup size
du -sh backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db
```

---

## Troubleshooting

### Backup Script Fails

**Error: Container not running**
```bash
# Start containers first
docker-compose up -d

# Then run backup
./backup.sh
```

**Error: Permission denied**
```bash
# Make script executable (Linux/Mac)
chmod +x backup.sh
```

### Restore Fails

**Error: Database is locked**
```bash
# Stop backend container
docker-compose stop backend

# Restore database
docker cp ./backups/backup.db progress-tracker-backend:/app/data/progress_tracker.db

# Start backend
docker-compose start backend
```

---

## Cloud Backup Integration

### Google Drive (Linux/Mac with rclone)

```bash
# Install rclone and configure Google Drive
# Then add to backup script:

# After creating backup
rclone copy ./backups/ gdrive:progress-tracker-backups/
```

### Dropbox

```bash
# Install Dropbox CLI
# Then:
cp ./backups/progress_tracker_backup_*.db ~/Dropbox/progress-tracker-backups/
```

### Git (for small databases)

```bash
# Add specific backup to git
git add backups/progress_tracker_backup_YYYYMMDD_HHMMSS.db
git commit -m "Database backup YYYYMMDD"
git push
```

**Note:** Only do this if your database is small (<100 MB) and doesn't contain sensitive data.

---

## Backup Retention Policy

The backup scripts automatically keep the **last 10 backups** and delete older ones.

To change retention:

**In `backup.sh`:**
```bash
# Change this line (currently keeps 10)
ls -t "$BACKUP_DIR"/progress_tracker_backup_*.db | tail -n +11 | xargs rm -f
#                                                              ^^
# Change 11 to (desired_count + 1)
```

**In `backup.bat`:**
```batch
REM Change this line (currently keeps 10)
if !COUNT! GTR 10 (
REM              ^^
REM Change to desired count
```

---

## Summary

✅ **Backup:** Run `./backup.sh` or `backup.bat`  
✅ **Restore:** Copy backup to container and restart  
✅ **Automate:** Use cron (Linux/Mac) or Task Scheduler (Windows)  
✅ **Verify:** Check backup files regularly  
✅ **Off-site:** Copy to cloud storage for safety  

**Your data is precious - back it up regularly!** 💾

