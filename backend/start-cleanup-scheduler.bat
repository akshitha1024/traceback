@echo off
echo Starting TrackeBack Cleanup Scheduler...
echo This will automatically delete claimed items older than 3 days
echo.

cd /d "%~dp0"
python cleanup_scheduler.py

pause
