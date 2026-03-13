@echo off
setlocal

cd /d "%~dp0\.."

if not exist ".env" if exist ".env.example" (
  copy /Y ".env.example" ".env" >nul
  echo Created .env from .env.example
)

if not exist "backend\.env" if exist "backend\.env.example" (
  copy /Y "backend\.env.example" "backend\.env" >nul
  echo Created backend\.env from backend/.env.example
)

docker compose up -d --build
if errorlevel 1 exit /b %errorlevel%

echo.
echo Project started.
echo Swagger: http://localhost:3000/api/docs
echo Frontend: http://localhost:5173
echo Admin login: admin
echo Admin password: Admin123!
