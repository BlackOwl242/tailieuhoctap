@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "ROOT=%~dp0"
if not defined HANOI_SERVICES_PORT set "HANOI_SERVICES_PORT=8766"
pushd "%ROOT%" || goto path_error

where python >nul 2>&1
if errorlevel 1 (
    echo Python 3.10+ khong tim thay. Hay cai Python va bat tuy chon Add Python to PATH.
    goto startup_error
)
python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)"
if errorlevel 1 (
    echo Can Python 3.10 tro len. Phien ban Python hien tai qua cu.
    goto startup_error
)

if not exist "app.py" (
    echo Khong tim thay app.py trong thu muc: %ROOT%
    goto startup_error
)
if not exist "procedure_workflows.py" (
    echo Thieu procedure_workflows.py. Hay khoi phuc ma nguon day du cua du an.
    goto startup_error
)
if not exist "workflow_extensions.py" (
    echo Thieu workflow_extensions.py. Hay khoi phuc ma nguon day du cua du an.
    goto startup_error
)

echo Checking Python dependencies...
python -c "import cryptography" >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies from requirements.txt...
    python -m pip install -r requirements.txt
    if errorlevel 1 goto dependency_error
)

if not exist "frontend\package.json" (
    echo Khong tim thay frontend\package.json.
    goto startup_error
)
where npm >nul 2>&1
if errorlevel 1 (
    echo Node.js va npm khong tim thay. Hay cai Node.js 20.19+ roi mo lai.
    goto startup_error
)
echo Building the React application...
pushd "frontend" || goto frontend_error
if not exist "node_modules\vite\bin\vite.js" (
    echo Installing frontend packages...
    call npm ci
    if errorlevel 1 goto frontend_error
)
call npm run build
if errorlevel 1 goto frontend_error
popd

echo Starting the Hanoi administrative services system...
echo Open http://127.0.0.1:%HANOI_SERVICES_PORT% in your browser.
python -X utf8 app.py
set "APP_EXIT=%ERRORLEVEL%"
if not "%APP_EXIT%"=="0" goto server_error
popd
exit /b 0

:frontend_error
popd
echo.
echo Frontend build failed. Check Node.js/npm and the build error above.
goto failed

:dependency_error
echo.
echo Could not install Python dependencies. Check the network and pip error above.
goto failed

:server_error
echo.
echo The server stopped with exit code %APP_EXIT%. Review the Python traceback above.
goto failed

:path_error
echo Cannot open the application folder: %ROOT%
goto failed

:startup_error
echo.
echo Startup checks failed. The application was not started.
goto failed

:failed
echo.
pause
exit /b 1
