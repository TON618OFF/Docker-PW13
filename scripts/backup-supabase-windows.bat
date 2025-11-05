@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo ========================================
echo Backup Supabase project Imperial Tunes
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
set NODE_CHECK=%ERRORLEVEL%
if !NODE_CHECK! NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Change to project root directory
cd /d "%~dp0\.."
set CD_CHECK=%ERRORLEVEL%
if !CD_CHECK! NEQ 0 (
    echo [ERROR] Failed to change directory!
    pause
    exit /b 1
)

REM Check for .env.backup file
if not exist ".env.backup" (
    echo [ERROR] File .env.backup not found in project root!
    echo.
    echo Current directory: %CD%
    echo.
    echo Create .env.backup file in project root with:
    echo SUPABASE_URL=https://xxxxx.supabase.co
    echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    echo SUPABASE_DB_URL=postgresql://...
    echo BACKUP_DIR=./backups
    echo.
    pause
    exit /b 1
)

echo [INFO] File .env.backup found in: %CD%
echo.

REM Load environment variables from .env.backup
echo [INFO] Loading environment variables from .env.backup...
for /f "usebackq tokens=1,* delims==" %%a in ("%CD%\.env.backup") do (
    set "line=%%a"
    if not "!line!"=="" (
        echo !line! | findstr /R "^#" >nul
        if errorlevel 1 (
            set "var_name=%%a"
            set "var_value=%%b"
            if not "!var_name!"=="" (
                if "!var_value!"=="" set "var_value="
                set "!var_name!=!var_value!"
            )
        )
    )
)

REM Check required variables
if "!SUPABASE_URL!"=="" (
    echo [ERROR] SUPABASE_URL not set in .env.backup
    pause
    exit /b 1
)

if "!SUPABASE_SERVICE_ROLE_KEY!"=="" (
    echo [ERROR] SUPABASE_SERVICE_ROLE_KEY not set in .env.backup
    pause
    exit /b 1
)

echo [INFO] Environment variables loaded
set "url_preview=!SUPABASE_URL:~0,30!"
echo [INFO] SUPABASE_URL set (preview: !url_preview!...)
echo.

REM Set environment variables for Node.js
set "SUPABASE_URL=!SUPABASE_URL!"
set "SUPABASE_SERVICE_ROLE_KEY=!SUPABASE_SERVICE_ROLE_KEY!"
if not "!SUPABASE_DB_URL!"=="" set "SUPABASE_DB_URL=!SUPABASE_DB_URL!"
if not "!BACKUP_DIR!"=="" set "BACKUP_DIR=!BACKUP_DIR!"

echo [INFO] Starting backup script...
echo.

REM Check if script exists
if not exist "%~dp0\backup-supabase.js" (
    echo [ERROR] Script backup-supabase.js not found in: %~dp0
    echo.
    pause
    exit /b 1
)

REM Run Node.js script
echo [INFO] Running backup script from directory: %CD%
echo.
node "%~dp0\backup-supabase.js"
set NODE_ERROR=%ERRORLEVEL%

echo.
echo ========================================
if !NODE_ERROR! EQU 0 (
    echo [SUCCESS] Backup completed successfully!
) else (
    echo [ERROR] An error occurred during backup creation
    echo Exit code: !NODE_ERROR!
)
echo ========================================
echo.
pause
endlocal
