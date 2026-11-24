# Build Script for Modern Enigma 96 Windows Desktop Application
param(
    [string]$Configuration = "Release"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Locate dotnet
$dotnet = "dotnet"
if (Get-Command "dotnet" -ErrorAction SilentlyContinue) {
    $dotnet = "dotnet"
} elseif (Test-Path "$env:USERPROFILE\.dotnet\dotnet.exe") {
    $dotnet = "$env:USERPROFILE\.dotnet\dotnet.exe"
}

Write-Host "Building EnigmaMachine.sln ($Configuration)..." -ForegroundColor Cyan
& $dotnet build "$ScriptDir\EnigmaMachine.sln" -c $Configuration

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild succeeded successfully!" -ForegroundColor Green
} else {
    Write-Error "Build failed with exit code $LASTEXITCODE"
}
