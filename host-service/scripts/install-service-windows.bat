@echo off
:: ====================================================================
:: PARSEC CORE HOST - HEADLESS SYSTEM BOOT INSTALLER (Windows)
:: Installs Host Engine as an automatic service running under SYSTEM.
:: Allows remote streaming at boot, login screen, and user lock screen.
:: ====================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Please right-click and Run as Administrator!
    pause
    exit /b 1
)

set SERVICE_NAME=ParsecCoreHost
set BIN_PATH=%~dp0parsec-host-service.exe

if not exist "%BIN_PATH%" (
    echo [ERROR] Binary not found at %BIN_PATH%
    pause
    exit /b 1
)

echo [*] Stopping existing service if running...
net stop %SERVICE_NAME% >nul 2>&1
sc.exe delete %SERVICE_NAME% >nul 2>&1

echo [*] Creating Pre-Login SYSTEM Service...
sc.exe create %SERVICE_NAME% binPath= "%BIN_PATH%" start= auto DisplayName= "Bi Desk Low-Latency Host Service"

echo [*] Configuring recovery options (auto-restart on crash)...
sc.exe failure %SERVICE_NAME% reset= 60 actions= restart/5000/restart/5000/restart/5000

echo [*] Opening Firewall Ports for Low-Latency UDP P2P...
netsh advfirewall firewall add rule name="Bi Desk P2P UDP" dir=in action=allow protocol=UDP localport=8000-9000
netsh advfirewall firewall add rule name="Bi Desk Host Service" dir=in action=allow program="%BIN_PATH%" enable=yes

echo [*] Starting Service...
net start %SERVICE_NAME%

echo ====================================================================
echo [SUCCESS] Bi Desk Host Service is now installed and active!
echo It will start automatically when Windows boots up, before any user logs in.
echo ====================================================================
pause
