@echo off
echo Installing Traceback Backend Dependencies...
echo.

cd /d "%~dp0"

echo Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo Failed to create virtual environment. Make sure Python is installed.
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing Python packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install packages.
    pause
    exit /b 1
)

echo.
echo Initializing database...
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database initialized successfully!')"

echo.
echo Backend setup completed successfully!
echo.
echo To start the backend server, run:
echo   cd backend
echo   venv\Scripts\activate
echo   python app.py
echo.
pause