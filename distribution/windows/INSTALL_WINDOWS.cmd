@echo off
setlocal
set "AHMED_RELEASE_DIR=%~dp0"
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $folder=$env:AHMED_RELEASE_DIR; $m=Get-Content -Raw -LiteralPath (Join-Path $folder 'manifest.json')|ConvertFrom-Json; if([IO.Path]::GetFileName($m.archive_name) -ne $m.archive_name){throw 'Invalid archive name'}; $zip=Join-Path $folder $m.archive_name; if(Test-Path -LiteralPath $zip){throw 'ZIP already exists. Keep it or move it before running again.'}; $stream=[IO.File]::Open($zip,[IO.FileMode]::CreateNew); try { foreach($part in $m.parts){if([IO.Path]::GetFileName($part.name) -ne $part.name){throw 'Invalid part name'}; $path=Join-Path (Join-Path $folder 'parts') $part.name; if((Get-Item -LiteralPath $path).Length -ne $part.bytes -or (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLower() -ne $part.sha256){throw ('Corrupt part: '+$part.name)}; $partStream=[IO.File]::OpenRead($path); try{$partStream.CopyTo($stream)} finally{$partStream.Dispose()} } } finally {$stream.Dispose()}; if((Get-Item -LiteralPath $zip).Length -ne $m.archive_bytes -or (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLower() -ne $m.archive_sha256){throw 'ZIP verification failed'}; $destination=Join-Path $folder 'ready'; if(Test-Path -LiteralPath $destination){throw 'The ready folder already exists; it was not overwritten.'}; Expand-Archive -LiteralPath $zip -DestinationPath $destination; Write-Host ('Ready: '+(Join-Path $destination 'AhmedHatemJobs-Windows-x64\AhmedHatemJobs.exe'))"
if errorlevel 1 (
  echo Assembly failed. Read the message above. Existing files were preserved.
  pause
  exit /b 1
)
echo Open ready\AhmedHatemJobs-Windows-x64\AhmedHatemJobs.exe
pause
