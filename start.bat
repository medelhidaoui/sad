@echo off
echo Starting WhatsApp Multi-Profile Manager...

REM Set environment variables
set PORT=85
set NODE_ENV=production
set DATABASE_URL=sqlite:%APPDATA%\whatsapp-manager\database.sqlite

REM Start the application
npm start

pause
