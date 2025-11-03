@echo off
echo Starting Traceback Simple Backend Server...
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Virtual environment activated
echo Starting Flask server on http://localhost:5000
python simple_app.py
pause