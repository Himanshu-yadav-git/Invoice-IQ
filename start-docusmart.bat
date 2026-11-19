@echo off
title DocuSmart AI Server
echo ===================================================
echo Starting DocuSmart AI Production Server...
echo Website will open automatically at http://localhost:3000
echo Keep this window open while using the web app.
echo ===================================================
cd /d "%~dp0"

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

call npm.cmd run start
pause
