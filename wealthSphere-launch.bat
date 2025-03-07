@echo off
setlocal EnableDelayedExpansion

echo Starting WealthSphere.

:: Define the target directory in the user's home folder
set "TARGET_DIR=%USERPROFILE%\wealthsphere"
echo Target directory: %TARGET_DIR%

:: Check if Rancher Desktop/Docker is running
echo Checking if Rancher Desktop is running.
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Rancher Desktop does not appear to be running.
    echo Please start Rancher Desktop and wait for it to initialize, then try again.
    pause
    exit /b 1
)

:: Navigate to the directory
cd /d "%TARGET_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to navigate to %TARGET_DIR%. 
    echo Please make sure WealthSphere is installed by running the setup script first.
    pause
    exit /b 1
)

:: Step 1: Update the code with git pull
echo Updating WealthSphere to the latest version.
git pull
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Failed to update the repository. Continuing with existing code.
    echo If you encounter issues, please run the setup script again.
)

:: Step 2: Run Docker Compose
echo Starting the WealthSphere application.
docker compose down
echo Stopped any existing containers.

docker compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo Failed to start Docker Compose. Ensure Rancher Desktop is running properly and try again.
    pause
    exit /b 1
)

:: Step 3: Open the browser
echo Opening WealthSphere in your browser.
timeout /t 5 >nul
start http://localhost:3000

echo WealthSphere is now running at http://localhost:3000
echo You can close this window, and WealthSphere will continue running in the background.
echo To stop WealthSphere, run 'docker compose down' in the %TARGET_DIR% directory.
pause 