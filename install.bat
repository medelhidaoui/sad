@echo off
echo Installing WhatsApp Multi-Profile Manager...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install

REM Create data directory
echo Creating data directory...
if not exist "%APPDATA%\whatsapp-manager" mkdir "%APPDATA%\whatsapp-manager"
if not exist "%APPDATA%\whatsapp-manager\sessions" mkdir "%APPDATA%\whatsapp-manager\sessions"

REM Build the application
echo Building the application...
npm run build

echo Installation complete!
echo You can now run the application using start.bat
pause
