@echo off
setlocal
cd /d "%~dp0.."
py -3.12 -m venv .venv
if errorlevel 1 goto failed
.venv\Scripts\python.exe -m pip install -r requirements.txt -c requirements-windows.lock
if errorlevel 1 goto failed
.venv\Scripts\python.exe -m playwright install chromium
if errorlevel 1 goto failed
echo Setup complete. Run scripts\run_windows.bat
pause
exit /b 0
:failed
echo Setup failed. Read the error above. No submissions were made.
pause
exit /b 1
