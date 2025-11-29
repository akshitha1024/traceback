@echo off
REM TraceBack - Start All Services Script (Windows)
REM This script starts all required services for TraceBack

echo ================================================
echo 🚀 Starting TraceBack Lost ^& Found System
echo ================================================
echo.

REM Check if we're in the correct directory
if not exist "backend" (
    echo ❌ Error: backend directory not found!
    echo Please run this script from the traceback root directory
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Check Python
echo 🔍 Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python found

REM Check Node.js
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo ================================================
echo 📦 Starting Services...
echo ================================================
echo.

REM Start Backend API
echo 🔧 Starting Backend API on port 5000...
start "TraceBack Backend" cmd /c "cd backend && python comprehensive_app.py > ..\logs\backend.log 2>&1"
timeout /t 3 /nobreak >nul
echo ✅ Backend API started

REM Start ML Scheduler
echo 🤖 Starting ML Scheduler (runs every 1 hour)...
start "TraceBack ML Scheduler" cmd /c "cd backend && python combined_scheduler.py > ..\logs\scheduler.log 2>&1"
timeout /t 3 /nobreak >nul
echo ✅ ML Scheduler started

REM Check for pnpm or npm
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    set PKG_MGR=pnpm
    echo ✅ Using pnpm
) else (
    set PKG_MGR=npm
    echo ✅ Using npm
)

REM Start Frontend
echo 🎨 Starting Frontend on port 3000...
start "TraceBack Frontend" cmd /c "%PKG_MGR% run dev > logs\frontend.log 2>&1"
timeout /t 3 /nobreak >nul
echo ✅ Frontend started

echo.
echo ================================================
echo ✅ All Services Started Successfully!
echo ================================================
echo.
echo 📊 Service Status:
echo    Backend API: http://localhost:5000
echo    ML Scheduler: Running in background
echo    Frontend: http://localhost:3000
echo.
echo 📁 Logs:
echo    Backend: logs\backend.log
echo    Scheduler: logs\scheduler.log
echo    Frontend: logs\frontend.log
echo.
echo ⏰ ML Matching runs every 1 hour automatically
echo 🗑️  Cleanup runs daily at 2:00 AM
echo.
echo ℹ️  Three command windows have opened for each service
echo ℹ️  Close those windows to stop the services
echo.
echo 🌐 Open your browser to: http://localhost:3000
echo ================================================
echo.
pause
