@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22 or newer, then retry.
  exit /b 1
)
node "%~dp0server\index.mjs"
exit /b %errorlevel%
