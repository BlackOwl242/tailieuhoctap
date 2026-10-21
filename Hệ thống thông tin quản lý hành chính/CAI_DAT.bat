@echo off
setlocal EnableExtensions
chcp 65001 >nul
rem Install dependencies, build the web app, provision the citizen account, and start.
call "%~dp0run.bat"
exit /b %ERRORLEVEL%
