@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo Checking Python dependencies...
python -c "import cryptography" >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies from requirements.txt...
    python -m pip install -r requirements.txt
    if errorlevel 1 goto server_error
)
echo Building the React application...
cd frontend
if not exist node_modules\vite\bin\vite.js (
    echo Installing frontend packages...
    call npm ci
    if errorlevel 1 goto frontend_error
)
call npm run build
if errorlevel 1 goto frontend_error
cd ..
echo Starting the Hanoi administrative services system...
echo Open http://127.0.0.1:8766 in your browser.
python -X utf8 app.py
if errorlevel 1 goto server_error
exit /b 0

:frontend_error
cd ..
echo.
echo Frontend build failed. Check the Node.js and npm installation and the error above.
pause
exit /b 1

:server_error
echo.
echo The Python server stopped with an error. Check Python, requirements.txt, and the error above.
pause
exit /b 1
