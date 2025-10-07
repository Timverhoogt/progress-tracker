# Data Persistence Guide for Progress Tracker

## ✅ Current Setup - You're Already Protected!

Your Docker setup is **correctly configured** for data persistence. Here's how it works:

### Docker Volume Configuration

```yaml
volumes:
  sqlite_data:
    driver: local
```

Your backend container mounts this volume:
```yaml
volumes:
  - sqlite_data:/app/data
```

**What this means:**
- Your SQLite database lives in a **Docker named volume** (`progress-tracker_sqlite_data`)
- This volume is **separate from your containers**
- Data persists even when containers are stopped, removed, or rebuilt

---

## 🔒 Data Persistence Guarantees

### ✅ Your Data WILL Persist Through:

1. **Container restarts**
   ```bash
   docker-compose restart
   ```

2. **Container rebuilds**
   ```bash
   docker-compose up -d --build
   ```

3. **Stopping and starting containers**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **Code updates and deployments**
   - Pull new code from git
   - Rebuild containers
   - Your database remains intact

### ❌ Your Data WILL BE LOST If:

1. **You explicitly delete the volume**
   ```bash
   docker volume rm progress-tracker_sqlite_data  # DON'T DO THIS!
   ```

2. **You use `docker-compose down -v`** (the `-v` flag removes volumes)
   ```bash
   docker-compose down -v  # DANGEROUS! Deletes data
   ```

3. **You prune all volumes**
   ```bash
   docker volume prune -a  # DANGEROUS! Deletes unused volumes
   ```

---

## 📊 Current Status Check

Your volume is currently storing:
- **Location:** `/var/lib/docker/volumes/progress-tracker_sqlite_data/_data`
- **Database:** `progress_tracker.db` (528 KB)
- **WAL files:** `progress_tracker.db-wal` (SQLite Write-Ahead Log)
- **SHM files:** `progress_tracker.db-shm` (Shared memory)

---

## 🛡️ Best Practices for Data Safety

### 1. **Safe Container Operations**

✅ **SAFE - Use these commands:**
```bash
# Rebuild containers (data persists)
docker-compose up -d --build

# Restart containers
docker-compose restart

# Stop containers (data persists)
docker-compose down

# View logs
docker-compose logs -f backend
```

❌ **DANGEROUS - Avoid these:**
```bash
# Removes volumes (DELETES DATA!)
docker-compose down -v

# Removes specific volume (DELETES DATA!)
docker volume rm progress-tracker_sqlite_data

# Prunes all volumes (DELETES DATA!)
docker volume prune -a
```

### 2. **Regular Backups**

Create automated backups of your database:

```bash
# Manual backup
docker exec progress-tracker-backend cp /app/data/progress_tracker.db /app/data/progress_tracker_backup_$(date +%Y%m%d_%H%M%S).db

# Or copy to host
docker cp progress-tracker-backend:/app/data/progress_tracker.db ./backups/backup_$(date +%Y%m%d).db
```

### 3. **Backup Script** (Recommended)

Create a file `backup.sh`:
```bash
#!/bin/bash
# Backup Progress Tracker Database

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="progress_tracker_backup_${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Copy database from container
docker cp progress-tracker-backend:/app/data/progress_tracker.db "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Keep only last 10 backups
ls -t $BACKUP_DIR/progress_tracker_backup_*.db | tail -n +11 | xargs -r rm

echo "✅ Old backups cleaned up (keeping last 10)"
```

Make it executable:
```bash
chmod +x backup.sh
```

Run it:
```bash
./backup.sh
```

### 4. **Automated Backups with Cron**

Add to your crontab (Linux/Mac):
```bash
# Backup every day at 2 AM
0 2 * * * cd /path/to/progress-tracker && ./backup.sh >> ./backups/backup.log 2>&1
```

For Windows, use Task Scheduler to run the backup script daily.

---

## 🔍 Verify Data Persistence

### Check Volume Exists
```bash
docker volume ls | grep progress-tracker
```

Expected output:
```
progress-tracker_sqlite_data
```

### Inspect Volume
```bash
docker volume inspect progress-tracker_sqlite_data
```

### Check Database Inside Container
```bash
docker exec progress-tracker-backend ls -lh /app/data/
```

Expected output:
```
progress_tracker.db
progress_tracker.db-wal
progress_tracker.db-shm
```

### Verify Database Size
```bash
docker exec progress-tracker-backend du -sh /app/data/progress_tracker.db
```

---

## 🚀 Deployment Workflow (Safe)

Here's the safe workflow for updating your app:

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild containers (data persists automatically)
docker-compose up -d --build

# 3. Check logs
docker-compose logs -f backend

# 4. Verify data is intact
docker exec progress-tracker-backend ls -lh /app/data/
```

**Your data is safe throughout this entire process!**

---

## 💾 Backup & Restore Procedures

### Create Backup
```bash
# Create backups directory
mkdir -p backups

# Backup database
docker cp progress-tracker-backend:/app/data/progress_tracker.db ./backups/backup_$(date +%Y%m%d).db

# Verify backup
ls -lh backups/
```

### Restore from Backup
```bash
# Stop containers
docker-compose down

# Copy backup to volume (using temporary container)
docker run --rm -v progress-tracker_sqlite_data:/data -v $(pwd)/backups:/backup alpine sh -c "cp /backup/backup_YYYYMMDD.db /data/progress_tracker.db"

# Start containers
docker-compose up -d
```

Or restore while running:
```bash
# Copy backup into running container
docker cp ./backups/backup_YYYYMMDD.db progress-tracker-backend:/app/data/progress_tracker.db

# Restart backend to reload database
docker-compose restart backend
```

---

## 📋 Quick Reference

### Safe Commands (Data Persists)
- `docker-compose up -d --build` ✅
- `docker-compose restart` ✅
- `docker-compose down` ✅
- `docker-compose stop` ✅
- `docker-compose start` ✅

### Dangerous Commands (Data Loss)
- `docker-compose down -v` ❌
- `docker volume rm progress-tracker_sqlite_data` ❌
- `docker volume prune` ❌

### Backup Commands
- `docker cp progress-tracker-backend:/app/data/progress_tracker.db ./backup.db` ✅
- `./backup.sh` ✅

---

## 🎯 Summary

**You're already set up correctly!** Your data is safe because:

1. ✅ Using Docker named volumes (not bind mounts)
2. ✅ Volume is separate from container lifecycle
3. ✅ Data persists through rebuilds and restarts
4. ✅ SQLite database is stored in the persistent volume

**Just remember:**
- Never use `docker-compose down -v`
- Create regular backups
- Your data survives container rebuilds automatically

**Your current database (528 KB with 18 notes) is safely stored in the Docker volume and will persist through all normal operations!** 🎉

