@echo off
title Disaster Relief Supply Chain Optimizer - Launcher
echo =====================================================================
echo Starting Disaster Relief Supply Chain Optimizer...
echo =====================================================================

cd /d "%~dp0"

echo [1/2] Starting Spring Boot Backend (Port 8080)...
start "Backend - Spring Boot" cmd /k "cd backend && ..\mvn.cmd spring-boot:run"

echo [2/2] Starting React Frontend (Port 5173)...
start "Frontend - Vite Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo Application started!
echo Frontend: http://localhost:5173/
echo Backend Swagger API: http://localhost:8080/swagger-ui.html
echo H2 Database Console: http://localhost:8080/h2-console
echo.
pause
