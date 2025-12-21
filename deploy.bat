@echo off
REM Innovative Ideas - Automated Build and Deploy Script
REM Builds the application and deploys to SharePoint using REST API

echo 🚀 Starting Innovative Ideas Build and Deployment
echo.

REM Check if Node.js is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: npm not found. Please install Node.js
    pause
    exit /b 1
)

REM Build the application for SharePoint
echo 📦 Building application for SharePoint...
call npm run build:sharepoint
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build completed successfully
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: PowerShell not found
    pause
    exit /b 1
)

REM Deploy using PowerShell script
echo 📤 Starting deployment to SharePoint...
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
if %errorlevel% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo 🎉 Build and deployment completed successfully!
echo Your application is now live at: http://hospp16srv:36156/innovativeIdeas/dist/index.html
echo.
pause