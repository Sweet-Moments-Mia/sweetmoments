@echo off
chcp 65001 >nul
title Sweet Moments
cd /d "%~dp0"
echo.
echo   Sweet Moments se startuva...
echo   Stranata:  http://localhost:3000
echo   Admin:     http://localhost:3000/admin.html
echo.
echo   NE go zatvorajte ovoj prozorec dodeka ja koristite stranata.
echo.
start "" http://localhost:3000
node server.js
echo.
echo   Serverot zastana. Pritisnete bilo koe kopce za da zatvorite.
pause >nul
