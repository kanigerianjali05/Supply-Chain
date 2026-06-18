@echo off
REM AI Supply Chain Control Tower - Setup Script for Windows
REM This script sets up the entire development environment

echo 🚀 AI Supply Chain Control Tower Setup
echo ======================================
echo.

REM Check Python
echo ✓ Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    exit /b 1
)

REM Check Node.js
echo ✓ Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 14+
    exit /b 1
)
npm --version

REM Backend setup
echo.
echo 📦 Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

REM Frontend setup
echo.
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Start backend:  cd backend ^&^& python app.py
echo 2. Start frontend: cd frontend ^&^& npm start
echo.
echo 📊 Dashboard will be available at: http://localhost:3000
echo.
pause
