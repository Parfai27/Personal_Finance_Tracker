@echo off
echo Starting Personal Finance Tracker Local Server...
echo.
echo The application will open in your browser at:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 8000
