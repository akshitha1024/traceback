@echo off
echo ========================================
echo Starting TrackeBack MySQL Server
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo ERROR: Virtual environment not found!
    echo Please run setup_database.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please run setup_database.bat first
    pause
    exit /b 1
)

echo Starting TrackeBack MySQL Backend Server...
echo.
echo Server will be available at:
echo   http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python mysql_app.py