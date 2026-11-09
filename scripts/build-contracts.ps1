# PowerShell Contract Build Script for Windows
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Set-Location $RootDir
Write-Host "Building Soroban contract WASM..." -ForegroundColor Cyan
stellar contract build

$WasmPath = Join-Path $RootDir "target\wasm32-unknown-unknown\release\polaris_escrow.wasm"
if (Test-Path $WasmPath) {
    $Size = (Get-Item $WasmPath).Length
    Write-Host "Success! WASM artifact built: $WasmPath ($Size bytes)" -ForegroundColor Green
} else {
    Write-Error "Failed to locate $WasmPath"
}
