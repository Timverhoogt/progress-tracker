@echo off
REM Database Restoration Script for Windows using existing Docker container
REM This script restores the SQLite database from the export file

setlocal

set EXPORT_FILE=..\database_export.sql

echo ================================
echo Database Restoration Script
echo ================================
echo Export file: %EXPORT_FILE%
echo.

REM Check if export file exists
if not exist "%EXPORT_FILE%" (
    echo Error: Export file not found at %EXPORT_FILE%
    exit /b 1
)

REM Check if Docker container is running
docker ps | findstr "progress-tracker-backend" >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: progress-tracker-backend container is not running
    echo Please start the containers first: docker-compose up -d
    exit /b 1
)

echo Copying export file to container...
docker cp "%EXPORT_FILE%" progress-tracker-backend:/app/database_export.sql
if %errorlevel% neq 0 (
    echo Error: Failed to copy export file to container
    exit /b 1
)

echo.
echo Backing up existing database...
docker exec progress-tracker-backend sh -c "cp /app/data/progress_tracker.db /app/data/progress_tracker.db.backup_$(date +%%Y%%m%%d_%%H%%M%%S) 2>/dev/null || true"

echo.
echo Installing sqlite3 in container...
docker exec progress-tracker-backend sh -c "apk add --no-cache sqlite 2>/dev/null || apt-get update && apt-get install -y sqlite3 2>/dev/null || true"

echo.
echo Restoring database from export file...
docker exec progress-tracker-backend sh -c "sqlite3 /app/data/progress_tracker.db < /app/database_export.sql"

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo Database restored successfully!
    echo ================================
    echo.
    echo Verifying restoration...
    docker exec progress-tracker-backend sh -c "sqlite3 /app/data/progress_tracker.db 'SELECT COUNT(*) as projects FROM projects; SELECT COUNT(*) as notes FROM notes; SELECT COUNT(*) as todos FROM todos;'"
    echo.
    echo Cleaning up...
    docker exec progress-tracker-backend sh -c "rm /app/database_export.sql"
    echo.
    echo Done! Restart the backend to use the restored database:
    echo   docker-compose restart backend
) else (
    echo.
    echo Error: Database restoration failed
    echo Check the container logs: docker logs progress-tracker-backend
    exit /b 1
)

endlocal