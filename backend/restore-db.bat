@echo off
REM Database Restoration Script for Windows
REM This script restores the SQLite database from the export file

setlocal

if "%SQLITE_DB_PATH%"=="" (
    set DB_PATH=.\data\progress_tracker.db
) else (
    set DB_PATH=%SQLITE_DB_PATH%
)

set EXPORT_FILE=..\database_export.sql

echo ================================
echo Database Restoration Script
echo ================================
echo Database path: %DB_PATH%
echo Export file: %EXPORT_FILE%
echo.

REM Check if export file exists
if not exist "%EXPORT_FILE%" (
    echo Error: Export file not found at %EXPORT_FILE%
    exit /b 1
)

REM Backup existing database if it exists
if exist "%DB_PATH%" (
    for /f "tokens=1-4 delims=/:. " %%a in ("%date% %time%") do set TIMESTAMP=%%c%%a%%b_%%d%%e%%f
    set BACKUP_PATH=%DB_PATH%.backup.%TIMESTAMP%
    echo Backing up existing database to: %BACKUP_PATH%
    copy "%DB_PATH%" "%BACKUP_PATH%" >nul
)

REM Restore database from export
echo Restoring database from export file...
sqlite3 "%DB_PATH%" < "%EXPORT_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo Database restored successfully!
    echo.
    echo Database statistics:
    sqlite3 "%DB_PATH%" "SELECT 'Projects: ' || COUNT(*) FROM projects; SELECT 'Notes: ' || COUNT(*) FROM notes; SELECT 'Todos: ' || COUNT(*) FROM todos;"
) else (
    echo.
    echo Error: Database restoration failed
    exit /b 1
)

endlocal