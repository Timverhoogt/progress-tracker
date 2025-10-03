@echo off
REM Progress Tracker Database Backup Script for Windows

setlocal enabledelayedexpansion

set BACKUP_DIR=backups
set CONTAINER_NAME=progress-tracker-backend

REM Get timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=progress_tracker_backup_%TIMESTAMP%.db

echo.
echo ========================================
echo Progress Tracker Database Backup
echo ========================================
echo.

REM Check if container is running
docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Container %CONTAINER_NAME% is not running
    exit /b 1
)

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
    echo Creating backup directory...
    mkdir "%BACKUP_DIR%"
)

REM Copy database from container
echo Copying database from container...
docker cp %CONTAINER_NAME%:/app/data/progress_tracker.db %BACKUP_DIR%\%BACKUP_FILE%

if exist "%BACKUP_DIR%\%BACKUP_FILE%" (
    echo.
    echo [SUCCESS] Backup created successfully!
    echo    File: %BACKUP_DIR%\%BACKUP_FILE%
    
    REM Get file size
    for %%A in ("%BACKUP_DIR%\%BACKUP_FILE%") do set BACKUP_SIZE=%%~zA
    set /a BACKUP_SIZE_KB=!BACKUP_SIZE! / 1024
    echo    Size: !BACKUP_SIZE_KB! KB
) else (
    echo.
    echo [ERROR] Backup file was not created
    exit /b 1
)

REM Keep only last 10 backups
echo.
echo Cleaning up old backups (keeping last 10)...

REM Count backup files
set COUNT=0
for %%F in ("%BACKUP_DIR%\progress_tracker_backup_*.db") do set /a COUNT+=1

if !COUNT! GTR 10 (
    REM Delete oldest backups
    set /a TO_DELETE=!COUNT! - 10
    
    REM Get list of files sorted by date (oldest first) and delete
    for /f "skip=10 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\progress_tracker_backup_*.db"') do (
        del "%BACKUP_DIR%\%%F"
        echo    Removed: %%F
    )
) else (
    echo    No cleanup needed (total backups: !COUNT!)
)

REM List recent backups
echo.
echo Recent backups:
dir /b /o-d "%BACKUP_DIR%\progress_tracker_backup_*.db" 2>nul | findstr /n "^" | findstr "^[1-5]:" | for /f "tokens=1* delims=:" %%A in ('more') do echo    %%B

echo.
echo ========================================
echo Backup complete!
echo ========================================
echo.

endlocal

