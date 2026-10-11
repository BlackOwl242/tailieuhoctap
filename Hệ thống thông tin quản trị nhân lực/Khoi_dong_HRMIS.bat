@echo off
setlocal EnableExtensions
pushd "%~dp0"
title Khoi dong HRMIS

echo.
echo ==========================================
echo          KHOI DONG HE THONG HRMIS
echo ==========================================
echo.

where docker >nul 2>&1
if errorlevel 1 goto DockerMissing

docker compose version >nul 2>&1
if errorlevel 1 goto ComposeMissing

docker info >nul 2>&1
if errorlevel 1 goto DockerNotRunning

echo Dang build va khoi dong cac dich vu database, API va giao dien...
docker compose up -d --build
if errorlevel 1 goto StartupFailed

set "APP_URL=http://localhost:8080"
set "WEB_PORT="
for /f "tokens=2 delims=:" %%P in ('docker compose port web 3000 2^>nul') do set "WEB_PORT=%%P"
set "WEB_PORT=%WEB_PORT: =%"
if defined WEB_PORT set "APP_URL=http://localhost:%WEB_PORT%"

echo.
echo Dang cho giao dien san sang...
set /a ATTEMPTS=0

:WaitForWeb
curl.exe -fsS --max-time 2 "%APP_URL%" >nul 2>&1
if not errorlevel 1 goto Ready
set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ 60 goto StartupTimedOut
timeout /t 2 >nul
goto WaitForWeb

:Ready
echo.
echo HRMIS da san sang tai %APP_URL%
echo Tai khoan demo va huong dan dang nhap nam trong README.md.
echo Dong cua so nay khong dung cac container; dung he thong bang docker compose down.
echo.
docker compose ps
start "" "%APP_URL%"
pause
popd
exit /b 0

:DockerMissing
echo Khong tim thay Docker. Hay cai Docker Desktop roi chay lai file nay.
goto Failed

:ComposeMissing
echo Docker Compose chua kha dung. Hay cap nhat Docker Desktop roi chay lai.
goto Failed

:DockerNotRunning
echo Docker Desktop chua san sang. Hay mo Docker Desktop, doi den khi khoi dong xong roi chay lai file nay.
goto Failed

:StartupFailed
echo Khong khoi dong duoc he thong. Trang thai va log gan nhat:
docker compose ps
docker compose logs --tail=80
goto Failed

:StartupTimedOut
echo Giao dien chua san sang sau 120 giay. Trang thai va log gan nhat:
docker compose ps
docker compose logs --tail=80

:Failed
echo.
pause
popd
exit /b 1
