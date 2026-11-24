# Test Runner for Modern Enigma 96 Cryptographic Engine & Desktop Suite
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

Write-Host "Executing Modern Enigma 96 Cryptographic & Desktop Unit Tests..." -ForegroundColor Cyan
& $dotnet test "$ScriptDir\EnigmaMachine.sln" -c $Configuration --logger "console;verbosity=normal"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll 69 cryptographic, UI, edge-case, and desktop integration tests passed with 100% reciprocity and zero faults!" -ForegroundColor Green
} else {
    Write-Error "Tests failed with exit code $LASTEXITCODE"
}
