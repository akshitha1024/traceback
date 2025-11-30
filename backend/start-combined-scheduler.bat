@echo off
echo ====================================
echo Starting Combined Scheduler
echo ====================================
echo.
echo This will run:
echo - ML Matching: Every 1 hour
echo - Cleanup: Daily at 2:00 AM
echo.
echo Press Ctrl+C to stop
echo.
python combined_scheduler.py
pause
