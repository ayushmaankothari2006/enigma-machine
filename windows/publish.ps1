# Publish Script for Modern Enigma 96 Standalone Windows Desktop Executable
param(
    [switch]$Standalone = $true,
    [string]$OutputDirectory = "artifacts\publish"
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

$fullOutDir = Join-Path $ScriptDir $OutputDirectory

if ($Standalone) {
    Write-Host "Publishing Standalone Single-File .exe (win-x64, Self-Contained)..." -ForegroundColor Cyan
    & $dotnet publish "$ScriptDir\src\EnigmaMachine.Desktop\EnigmaMachine.Desktop.csproj" `
        -c Release `
        -r win-x64 `
        --self-contained true `
        -p:PublishSingleFile=true `
        -o $fullOutDir
} else {
    Write-Host "Publishing Framework-Dependent Executable..." -ForegroundColor Cyan
    & $dotnet publish "$ScriptDir\src\EnigmaMachine.Desktop\EnigmaMachine.Desktop.csproj" `
        -c Release `
        --self-contained false `
        -o $fullOutDir
}

if ($LASTEXITCODE -eq 0) {
    # Clean any lingering debug symbol files from final package
    Get-ChildItem -Path $fullOutDir -Filter "*.pdb" -ErrorAction SilentlyContinue | Remove-Item -Force

    $exePath = Join-Path $fullOutDir "EnigmaMachine.exe"
    Write-Host "`nPublish succeeded! Standalone executable located at:" -ForegroundColor Green
    Write-Host $exePath -ForegroundColor Yellow

    # Generate portable distribution ZIP archive
    if ($Standalone -and (Test-Path $exePath)) {
        $zipPath = Join-Path (Join-Path $ScriptDir "artifacts") "EnigmaMachine-v1.0.0-Windows-x64.zip"
        Compress-Archive -Path $exePath -DestinationPath $zipPath -Force
        Write-Host "Portable distribution ZIP created at:" -ForegroundColor Green
        Write-Host $zipPath -ForegroundColor Yellow
    }
} else {
    Write-Error "Publish failed with exit code $LASTEXITCODE"
}
