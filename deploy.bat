@echo off
echo ==========================================
echo       Deploying Advanced Notes App
echo ==========================================

echo [1/4] Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Frontend installation failed!
    pause
    exit /b %errorlevel%
)

echo [2/4] Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)

echo [3/4] Installing Backend Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Backend installation failed!
    cd ..
    pause
    exit /b %errorlevel%
)

echo [4/4] Starting Server...
echo Server will start at http://localhost:3000
echo Press Ctrl+C to stop.
npm run start
