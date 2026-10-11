@echo off
cd /d "%~dp0"
echo Building the React application...
cd frontend
if not exist node_modules\vite\bin\vite.js npm ci
if errorlevel 1 exit /b %errorlevel%
npm run build
if errorlevel 1 exit /b %errorlevel%
cd ..
echo Starting the Hanoi administrative services system...
echo Open http://127.0.0.1:8766 in your browser.
python app.py
