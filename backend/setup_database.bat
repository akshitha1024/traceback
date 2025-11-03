@echo off
echo ========================================
echo TrackeBack MySQL Database Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file with your MySQL credentials
    echo - DB_HOST: Your MySQL server host (usually localhost)
    echo - DB_USER: Your MySQL username (e.g., root)
    echo - DB_PASSWORD: Your MySQL password
    echo - DB_NAME: Database name (e.g., trackeback_db)
    echo.
    echo After editing .env, run this script again to set up the database.
    pause
    exit /b 0
)

REM Run database setup
echo Setting up MySQL database...
python database/setup.py

if errorlevel 1 (
    echo.
    echo ERROR: Database setup failed!
    echo Please check your MySQL credentials in .env file
    echo Make sure MySQL server is running
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database Setup Complete!
echo ========================================
echo.
echo Your TrackeBack database has been created with:
echo - Complete database schema
echo - Kent State campus locations
echo - Item categories
echo - 100,000 realistic lost and found items
echo - Security questions for verification
echo.
echo You can now start the server with:
echo   start_mysql_server.bat
echo.
echo Or run manually:
echo   python mysql_app.py
echo.
pause