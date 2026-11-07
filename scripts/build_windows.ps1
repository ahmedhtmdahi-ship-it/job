$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
py -3.12 -m venv .venv
if ($LASTEXITCODE -ne 0) { throw 'Python 3.12 is required' }
& .venv\Scripts\python.exe -m pip install -r requirements-dev.txt -c requirements-windows.lock
if ($LASTEXITCODE -ne 0) { throw 'Dependency install failed' }
& .venv\Scripts\python.exe -m playwright install chromium
if ($LASTEXITCODE -ne 0) { throw 'Browser install failed' }
& .venv\Scripts\python.exe -m pytest -q
if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
& .venv\Scripts\python.exe -m PyInstaller --noconfirm --clean --windowed --name AhmedHatemJobs --add-data 'ahmed_jobs/data;ahmed_jobs/data' --add-data 'docs/licenses;licenses' --collect-all playwright run_app.py
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
$smoke = New-Object System.Diagnostics.ProcessStartInfo
$smoke.FileName = Join-Path (Get-Location) 'dist\AhmedHatemJobs\AhmedHatemJobs.exe'
$smoke.Arguments = '--smoke-test'
$smoke.UseShellExecute = $false
$smoke.EnvironmentVariables['AHMED_JOBS_SMOKE_DIR'] = Join-Path ([System.IO.Path]::GetTempPath()) ('AhmedHatemSmoke_' + [Guid]::NewGuid().ToString('N'))
$process = [System.Diagnostics.Process]::Start($smoke)
if (-not $process.WaitForExit(30000)) { $process.Kill(); throw 'Packaged GUI smoke test timed out' }
if ($process.ExitCode -ne 0) { throw 'Packaged GUI smoke test failed' }
Write-Host 'Output: dist\AhmedHatemJobs\AhmedHatemJobs.exe'
Write-Host 'Visible browser setup: .venv\Scripts\python.exe -m playwright install chromium'
