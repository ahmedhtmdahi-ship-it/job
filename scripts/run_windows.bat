@echo off
setlocal
cd /d "%~dp0.."
if not exist .venv\Scripts\python.exe (
  echo Run scripts\setup_windows.bat first.
  pause
  exit /b 1
)
.venv\Scripts\python.exe run_app.py
if errorlevel 1 pause
