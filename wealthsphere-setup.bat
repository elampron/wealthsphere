@echo off
setlocal EnableDelayedExpansion

echo Starting WealthSphere setup with Rancher Desktop.

:: Define the target directory in the user's home folder
set "TARGET_DIR=%USERPROFILE%\wealthsphere"
echo Target directory set to: %TARGET_DIR%

:: Step 1: Enable and Install WSL 2
echo Checking for WSL 2.
wsl --status >nul 2>&1
set WSL_STATUS=%ERRORLEVEL%
if %WSL_STATUS% EQU 0 goto WSL_INSTALLED

echo WSL 2 not detected. Enabling WSL and related features.
:: Enable WSL and Virtual Machine Platform (requires admin)
echo This step requires admin privileges. Please approve the UAC prompt if it appears.
powershell -Command "Start-Process -Verb RunAs -FilePath 'dism.exe' -ArgumentList '/online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart'"
powershell -Command "Start-Process -Verb RunAs -FilePath 'dism.exe' -ArgumentList '/online /enable-feature /featurename:VirtualMachinePlatform /all /norestart'"

:: Download and install WSL 2 kernel update
echo Downloading WSL 2 kernel update.
powershell -Command "Invoke-WebRequest -Uri 'https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi' -OutFile 'wsl_update_x64.msi'"
if !ERRORLEVEL! NEQ 0 (
    echo Failed to download WSL 2 update. Please install it manually from https://aka.ms/wsl2kernel
    pause
    exit /b 1
)
echo Installing WSL 2 update silently.
msiexec /i wsl_update_x64.msi /quiet /norestart
if !ERRORLEVEL! NEQ 0 (
    echo Failed to install WSL 2 update. Please try manually.
    pause
    exit /b 1
)

:: Set WSL 2 as default version
echo Setting WSL 2 as default.
wsl --set-default-version 2

:: Install Ubuntu silently
echo Installing Ubuntu 20.04 as the default WSL distro.
powershell -Command "Invoke-WebRequest -Uri 'https://aka.ms/wslubuntu2004' -OutFile 'Ubuntu2004.appx' -UseBasicParsing"
powershell -Command "Add-AppxPackage -Path 'Ubuntu2004.appx'"
if !ERRORLEVEL! NEQ 0 (
    echo Failed to install Ubuntu. Please install it from the Microsoft Store.
    pause
    exit /b 1
)
echo Ubuntu installed. Initializing first run (this may take a moment).
ubuntu2004.exe install --root
wsl -s Ubuntu-20.04
echo WSL 2 and Ubuntu setup complete. A restart may be required later.
goto WSL_DONE

:WSL_INSTALLED
echo WSL 2 is already installed.

:WSL_DONE

:: Step 2: Install Rancher Desktop
echo Checking for Rancher Desktop.
where docker >nul 2>&1
set DOCKER_STATUS=%ERRORLEVEL%
if %DOCKER_STATUS% EQU 0 goto RANCHER_INSTALLED

echo Rancher Desktop not found. Downloading and installing.
:: Download Rancher Desktop installer (latest stable as of March 2025, adjust URL if needed)
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/rancher-sandbox/rancher-desktop/releases/download/v1.13.0/Rancher.Desktop.Setup.1.13.0.exe' -OutFile 'RancherDesktopSetup.exe'"
if !ERRORLEVEL! NEQ 0 (
    echo Failed to download Rancher Desktop. Please download it manually from https://rancherdesktop.io/
    pause
    exit /b 1
)
echo Installing Rancher Desktop silently. Please approve the UAC prompt if it appears.
start /wait RancherDesktopSetup.exe /S /D=%ProgramFiles%\RancherDesktop
if !ERRORLEVEL! NEQ 0 (
    echo Failed to install Rancher Desktop. Please try manually.
    pause
    exit /b 1
)
echo Rancher Desktop installed. Starting it.
start "" "%ProgramFiles%\RancherDesktop\Rancher Desktop.exe"
:: Wait a bit for Rancher to initialize
timeout /t 20 >nul
goto RANCHER_DONE

:RANCHER_INSTALLED
echo Docker CLI detected (likely from Rancher Desktop). Proceeding.

:RANCHER_DONE

:: Step 3: Install Git
echo Checking for Git.
where git >nul 2>&1
set GIT_STATUS=%ERRORLEVEL%
if %GIT_STATUS% EQU 0 goto GIT_INSTALLED

echo Git not found. Downloading and installing.
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe' -OutFile 'GitInstaller.exe'"
if !ERRORLEVEL! NEQ 0 (
    echo Failed to download Git. Please install it manually from https://git-scm.com/download/win
    pause
    exit /b 1
)
echo Installing Git silently.
start /wait GitInstaller.exe /SILENT /NORESTART
if !ERRORLEVEL! NEQ 0 (
    echo Git installation failed. Please try manually.
    pause
    exit /b 1
)
echo Git installed successfully.
set "PATH=%PATH%;C:\Program Files\Git\cmd"
goto GIT_DONE

:GIT_INSTALLED
echo Git is already installed.

:GIT_DONE

:: Step 4: Clone the repository
echo Cloning the WealthSphere repository to %TARGET_DIR%.
if not exist "%TARGET_DIR%" (
    git clone https://github.com/elampron/wealthsphere.git "%TARGET_DIR%"
    if !ERRORLEVEL! NEQ 0 (
        echo Failed to clone the repository. Check your internet connection or try again.
        pause
        exit /b 1
    )
) else (
    echo Repository already exists at %TARGET_DIR%. Skipping clone.
)

:: Step 5: Copy the launch script to the target directory
echo Creating launch script in %TARGET_DIR%.
copy /Y "%~dp0wealthSphere-launch.bat" "%TARGET_DIR%\wealthSphere-launch.bat"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Failed to copy the launch script. You may need to copy it manually.
)

:: Step 6: Create desktop shortcut
echo Creating desktop shortcut.
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine($env:USERPROFILE, 'Desktop', 'WealthSphere.lnk')); $Shortcut.TargetPath = [System.IO.Path]::Combine($env:USERPROFILE, 'wealthsphere', 'wealthSphere-launch.bat'); $Shortcut.WorkingDirectory = [System.IO.Path]::Combine($env:USERPROFILE, 'wealthsphere'); $Shortcut.Description = 'Launch WealthSphere'; $Shortcut.IconLocation = 'shell32.dll,138'; $Shortcut.Save()"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Failed to create desktop shortcut. You can still run WealthSphere from %TARGET_DIR%\wealthSphere-launch.bat
)

:: Step 7: Run Docker Compose with Rancher Desktop
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
    echo Failed to start Docker Compose. Ensure Rancher Desktop is running and try again.
    pause
    exit /b 1
)

:: Step 8: Open the browser
echo Opening WealthSphere in your browser.
timeout /t 5 >nul
start http://localhost:3000

echo Setup complete! WealthSphere should be running at http://localhost:3000
echo A shortcut has been created on your desktop to easily launch WealthSphere in the future.
echo If it doesn't work, restart your computer and run this script again.
pause