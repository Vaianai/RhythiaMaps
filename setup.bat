@echo off

REM Rhythia Maps Setup Script for Windows
REM This script installs all dependencies and configures the project

echo 🎵 Rhythia Maps Setup Script
echo ==============================
echo.

REM Check Node.js
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)
echo ✓ Node.js installed
for /f "tokens=*" %%i in ('node -v') do echo %%i

REM Check npm
echo Checking npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)
echo ✓ npm installed
for /f "tokens=*" %%i in ('npm -v') do echo %%i

echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install root dependencies
    pause
    exit /b 1
)
echo ✓ Root dependencies installed

echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

REM Setup backend env file
if not exist .env (
    echo Creating .env file for backend...
    copy .env.example .env
    echo ⚠️  Please update backend\.env with your values
)

cd ..

echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

REM Setup frontend env file
if not exist .env (
    echo Creating .env file for frontend...
    copy .env.example .env
)

cd ..

echo.

REM Database setup instructions
echo Database Setup Instructions:
echo 1. Create a PostgreSQL database: createdb rhythia_maps
echo.
echo 2. Update DATABASE_URL in backend\.env
echo.
echo 3. Run migrations: npm run db:migrate --workspace=backend
echo.
echo 4. (Optional) Seed database: npm run db:seed --workspace=backend

echo.

REM Summary
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Update configuration files (.env files)
echo 2. Setup PostgreSQL database
echo 3. Run migrations
echo.
echo To start development:
echo   npm run dev
echo.
echo Alternatively:
echo   Backend:  cd backend ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm run dev
echo.

pause
