@echo off
echo 🚀 Starting ProCheck OCR System...
echo 📍 Server will be available at: http://localhost:3000
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Missing .env file. Please create one with MONGO_URI and ADMIN_TOKEN.
    pause
    exit /b
)

REM Start the server
echo 🔥 Starting development server...
npm run dev
pause