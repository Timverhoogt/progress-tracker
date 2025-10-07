# Database Restore Guide

This guide explains how to restore your Progress Tracker database from the `database_export.sql` file and ensure data persistence across Docker rebuilds.

## Quick Restore

### On Linux/Mac:
```bash
cd backend
npm run restore-db
```

### On Windows:
```bash
cd backend
npm run restore-db:win
```

## Manual Restoration

If you prefer to restore manually or the scripts don't work:

```bash
# Navigate to the project root
cd /path/to/progress-tracker

# Restore the database
sqlite3 backend/data/progress_tracker.db < database_export.sql
```

## Docker Container Restoration

To restore the database inside a running Docker container:

```bash
# Copy the export file into the container
docker cp database_export.sql progress-tracker-backend:/app/database_export.sql

# Execute the restoration inside the container
docker exec progress-tracker-backend sh -c "sqlite3 /app/data/progress_tracker.db < /app/database_export.sql"

# Verify the restoration
docker exec progress-tracker-backend sh -c "sqlite3 /app/data/progress_tracker.db 'SELECT COUNT(*) FROM projects; SELECT COUNT(*) FROM notes;'"
```

## Data Persistence Across Docker Rebuilds

Your database is configured to persist across Docker container rebuilds through volume mounting:

### Current Configuration (docker-compose.yml):
```yaml
backend:
  volumes:
    - ./backend/data:/app/data
```

This means:
- **Host Directory**: `./backend/data` (on your computer)
- **Container Directory**: `/app/data` (inside Docker)
- **Database File**: `backend/data/progress_tracker.db`

### What This Means:

✅ **PERSISTENT** - Data survives:
- Container restarts (`docker-compose restart`)
- Container rebuilds (`docker-compose up --build`)
- Container recreation (`docker-compose down && docker-compose up`)

❌ **NOT PERSISTENT** - Data is lost if you:
- Delete the `backend/data` directory
- Remove the volume manually
- Use `docker-compose down -v` (removes volumes)

## Accessing from Tailscale Network

Your database is accessible from other computers on the Tailscale network because:

1. **Nginx Proxy Configuration**: The frontend container (port 8082) proxies `/api` requests to the backend
2. **Docker Network**: Both containers are on the same Docker network (`progress-tracker-network`)
3. **Backend Binding**: The backend listens on `0.0.0.0:3060` (all interfaces)

### Access Flow:
```
Remote Computer (Tailscale) 
  → http://100.x.x.x:8082/api/projects
    → Nginx (frontend container)
      → http://backend:3060/api/projects
        → Backend Container
          → SQLite DB (/app/data/progress_tracker.db)
            → Host Directory (./backend/data/progress_tracker.db)
```

## Verification Steps

### 1. Verify Database Exists:
```bash
ls -lh backend/data/progress_tracker.db
```

### 2. Check Database Contents:
```bash
sqlite3 backend/data/progress_tracker.db "SELECT name FROM projects;"
```

### 3. Test from Remote Computer:
```bash
# Replace 100.x.x.x with your Tailscale IP
curl http://100.x.x.x:8082/api/projects
```

### 4. Verify Volume Mount in Docker:
```bash
docker inspect progress-tracker-backend --format="{{json .Mounts}}"
```

## Troubleshooting

### Issue: Sample Data Appears After Restore

**Cause**: The migration script was inserting sample data when it detected an empty database.

**Solution**: This has been disabled. The file `backend/src/database/migrate.ts` now skips sample data insertion entirely.

### Issue: Database Empty After Docker Rebuild

**Cause**: Volume mount might not be configured correctly.

**Check**:
1. Verify `docker-compose.yml` has the volume mount: `- ./backend/data:/app/data`
2. Ensure the `backend/data` directory exists on your host
3. Check file permissions on the `backend/data` directory

**Fix**:
```bash
# Ensure directory exists
mkdir -p backend/data

# Restore database
cd backend
npm run restore-db

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Issue: Can't Access from Remote Computer

**Symptoms**: Frontend loads but shows no projects.

**Debug Steps**:
1. Open browser DevTools (F12) → Console tab for JavaScript errors
2. Check Network tab for failed `/api/projects` requests
3. Verify both containers are running: `docker ps`
4. Test API directly: `curl http://YOUR-TAILSCALE-IP:8082/api/projects`

**Common Causes**:
- Backend container not running
- Nginx configuration issue
- Network connectivity problem

## Backup Strategy

### Create a Fresh Export:
```bash
sqlite3 backend/data/progress_tracker.db .dump > database_export_$(date +%Y%m%d).sql
```

### Automated Daily Backup:
Add to your crontab (Linux/Mac):
```bash
0 2 * * * sqlite3 /path/to/backend/data/progress_tracker.db .dump > /path/to/backups/db_$(date +\%Y\%m\%d).sql
```

## Important Notes

1. **Sample Data Disabled**: The automatic sample data insertion has been disabled to prevent accidental overwrites.

2. **Restore Script Safety**: The restore scripts automatically create a backup of any existing database before restoration.

3. **Data Location**: Always ensure your data is in `backend/data/progress_tracker.db` for proper Docker volume mounting.

4. **Network Access**: As long as both Docker containers are running and on the same network, remote access via Tailscale will work.

## Support

If you encounter issues:
1. Check Docker container logs: `docker logs progress-tracker-backend`
2. Verify volume mounts: `docker inspect progress-tracker-backend`
3. Test database directly: `sqlite3 backend/data/progress_tracker.db "SELECT COUNT(*) FROM projects;"`