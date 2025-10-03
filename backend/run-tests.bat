@echo off
REM Test Runner Script for Progress Tracker Backend (Windows)

setlocal enabledelayedexpansion

set TEST_TYPE=%1
set COVERAGE=%2

if "%TEST_TYPE%"=="" set TEST_TYPE=all
if "%COVERAGE%"=="" set COVERAGE=true

echo.
echo ==========================================
echo    Progress Tracker Test Runner
echo ==========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install Node.js and npm first.
    exit /b 1
)

REM Check if package.json exists
if not exist package.json (
    echo [ERROR] package.json not found. Please run this script from the backend directory.
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo [INFO] Installing dependencies...
    call npm install
)

REM Run tests based on type
if "%TEST_TYPE%"=="all" (
    echo.
    echo Running All Tests...
    echo.
    if "%COVERAGE%"=="true" (
        call npm test -- --coverage
    ) else (
        call npm test
    )
    goto :check_result
)

if "%TEST_TYPE%"=="unit" (
    echo.
    echo Running Unit Tests...
    echo.
    call npm run test:unit
    goto :check_result
)

if "%TEST_TYPE%"=="integration" (
    echo.
    echo Running Integration Tests...
    echo.
    call npm run test:integration
    goto :check_result
)

if "%TEST_TYPE%"=="watch" (
    echo.
    echo Running Tests in Watch Mode...
    echo.
    call npm run test:watch
    goto :check_result
)

if "%TEST_TYPE%"=="ci" (
    echo.
    echo Running Tests in CI Mode...
    echo.
    call npm run test:ci
    goto :check_result
)

if "%TEST_TYPE%"=="coverage" (
    echo.
    echo Running Tests with Coverage Report...
    echo.
    call npm test -- --coverage
    
    if exist coverage\lcov-report\index.html (
        echo.
        echo [SUCCESS] Coverage report generated!
        echo [INFO] Opening coverage report...
        start coverage\lcov-report\index.html
    )
    goto :check_result
)

if "%TEST_TYPE%"=="quick" (
    echo.
    echo Running Quick Tests (No Coverage)...
    echo.
    call npm test -- --coverage=false --maxWorkers=4
    goto :check_result
)

if "%TEST_TYPE%"=="verbose" (
    echo.
    echo Running Tests with Verbose Output...
    echo.
    call npm test -- --verbose
    goto :check_result
)

if "%TEST_TYPE%"=="help" (
    echo.
    echo Test Runner Help
    echo ================
    echo.
    echo Usage: run-tests.bat [TYPE] [COVERAGE]
    echo.
    echo Types:
    echo   all          - Run all tests (default)
    echo   unit         - Run only unit tests
    echo   integration  - Run only integration tests
    echo   watch        - Run tests in watch mode
    echo   ci           - Run tests in CI mode
    echo   coverage     - Run tests and open coverage report
    echo   quick        - Run tests without coverage (faster)
    echo   verbose      - Run tests with verbose output
    echo   help         - Show this help message
    echo.
    echo Coverage:
    echo   true         - Generate coverage report (default)
    echo   false        - Skip coverage report
    echo.
    echo Examples:
    echo   run-tests.bat all
    echo   run-tests.bat unit false
    echo   run-tests.bat coverage
    echo   run-tests.bat watch
    echo.
    exit /b 0
)

echo [ERROR] Unknown test type: %TEST_TYPE%
echo Run 'run-tests.bat help' for usage information
exit /b 1

:check_result
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo [SUCCESS] Tests completed successfully!
    echo ==========================================
    echo.
    
    if exist coverage\coverage-summary.json (
        if "%COVERAGE%"=="true" (
            echo Coverage report available at: coverage\lcov-report\index.html
        )
    )
    
    echo.
    echo All tests passed!
    echo.
) else (
    echo.
    echo ==========================================
    echo [FAILED] Tests failed!
    echo ==========================================
    echo.
    exit /b 1
)

endlocal

