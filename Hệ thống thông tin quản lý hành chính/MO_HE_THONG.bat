@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0mo_he_thong.ps1"
if errorlevel 1 pause
