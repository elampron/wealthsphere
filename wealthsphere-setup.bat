@echo off
setlocal EnableDelayedExpansion

echo Starting WealthSphere setup.

:: Define the target directory in the user's home folder
set "TARGET_DIR=%USERPROFILE%\wealthsphere"
echo Target directory set to: %TARGET_DIR%

:: Step 1: Check if Docker Desktop is installed
echo Checking for Docker Desktop.
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Docker Desktop is already installed.
) else (
    echo Docker Desktop not found. Downloading and installing.
    powershell -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/stable/Docker%%20Desktop%%20Installer.exe' -OutFile 'DockerDesktopInstaller.exe'"
    if !ERRORLEVEL! NEQ 0 (
        echo Failed to download Docker Desktop. Please download and install it manually from https://www.docker.com/products/docker-desktop/
        pause
        exit /b 1
    )
    echo Installing Docker Desktop. Please follow the installer prompts.
    start /wait DockerDesktopInstaller.exe
    if !ERRORLEVEL! NEQ 0 (
        echo Docker Desktop installation failed. Please try installing it manually.
        pause
        exit /b 1
    )
    echo Docker Desktop installed successfully. Please ensure it is running before proceeding.
    pause
)

:: Step 2: Check if Git is installed
echo Checking for Git.
where git >nul 2>&1
set GIT_STATUS=%ERRORLEVEL%
echo Git check result: ERRORLEVEL=%GIT_STATUS%

if %GIT_STATUS% NEQ 0 goto INSTALL_GIT
echo Git is already installed, proceeding.
goto AFTER_GIT

:INSTALL_GIT
echo Git not found. Downloading and installing.
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe' -OutFile 'GitInstaller.exe'"
if ERRORLEVEL 1 (
    echo Failed to download Git. Please download and install it manually from https://git-scm.com/download/win
    pause
    exit /b 1
)
echo Installing Git. Please follow the installer prompts (accept defaults if unsure).
start /wait GitInstaller.exe /SILENT /NORESTART
if ERRORLEVEL 1 (
    echo Git installation failed. Please try installing it manually.
    pause
    exit /b 1
)
echo Git installed successfully.
set "PATH=%PATH%;C:\Program Files\Git\cmd"

:AFTER_GIT

:: Step 3: Clone the repository to the hardcoded location
echo Cloning the WealthSphere repository to %TARGET_DIR%.
if not exist "%TARGET_DIR%" (
    git clone https://github.com/elampron/wealthsphere.git "%TARGET_DIR%"
    set CLONE_STATUS=!ERRORLEVEL!
    if !CLONE_STATUS! NEQ 0 (
        echo Failed to clone the repository. Check your internet connection or try again.
        pause
        exit /b 1
    )
) else (
    echo Repository already exists at %TARGET_DIR%. Skipping clone.
)

:: Step 4: Navigate to the directory and run Docker Compose
echo Starting the application with Docker Compose.
cd /d "%TARGET_DIR%"
set CD_STATUS=%ERRORLEVEL%
if %CD_STATUS% NEQ 0 (
    echo Failed to navigate to %TARGET_DIR%. Check if the directory exists.
    pause
    exit /b 1
)
docker compose up -d
set DOCKER_STATUS=%ERRORLEVEL%
if %DOCKER_STATUS% NEQ 0 (
    echo Failed to start Docker Compose. Ensure Docker Desktop is running and try again.
    pause
    exit /b 1
)

:: Step 5: Open the browser
echo Opening WealthSphere in your browser.
timeout /t 5 >nul
start http://localhost:3000

echo Setup complete! WealthSphere should be running at http://localhost:3000
pause