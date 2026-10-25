@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Instala Node.js LTS antes de continuar. & pause & exit /b 1)
call npm install --no-audit --no-fund || (echo Error al instalar dependencias. & pause & exit /b 1)
call npm run dev
pause
