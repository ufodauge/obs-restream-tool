@echo off
rem OBS Restream launcher. Double-click to configure and start OBS (portable mode).
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-OBS-Restream.ps1" %*
if errorlevel 1 (
  echo.
  echo Failed to start. See the message above.
  pause
)
