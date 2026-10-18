@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0mo_he_thong.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
    echo.
    echo Trinh khoi dong gap loi. Hay xem thong bao o tren va kiem tra cua so may chu.
    pause
)
exit /b %EXIT_CODE%
