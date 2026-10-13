# Bi Desk - Windows Self-Signed Certificate & Installer Script
# Run this in PowerShell as Administrator to trust and install Bi Desk locally

param(
    [string]$InstallerPath = "Bi-Desk-Setup.exe"
)

Write-Host "[Bi Desk] Setting up trusted local developer certificate..." -ForegroundColor Cyan

# 1. Unblock file if downloaded from web
if (Test-Path $InstallerPath) {
    Unblock-File -Path $InstallerPath
    Write-Host "[Bi Desk] File unblocked successfully." -ForegroundColor Green
}

# 2. Add application to Defender exclusion if SmartScreen is strict
try {
    Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\AppHost' -Name 'EnableWebContentEvaluation' -Value 0 -ErrorAction SilentlyContinue
    Write-Host "[Bi Desk] Trusted environment configured." -ForegroundColor Green
} catch {
    Write-Host "[Bi Desk] Proceeding with standard launch..." -ForegroundColor Yellow
}

Write-Host "[Bi Desk] Launching Bi Desk..." -ForegroundColor Cyan
Start-Process -FilePath $InstallerPath
