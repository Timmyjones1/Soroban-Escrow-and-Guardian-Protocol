# PowerShell Deployment Script for Windows
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$WasmPath = Join-Path $RootDir "target\wasm32-unknown-unknown\release\polaris_escrow.wasm"

if (-not (Test-Path $WasmPath)) {
    & "$ScriptDir\build-contracts.ps1"
}

Write-Host "Deploying PolarisPay Escrow contract to Stellar Testnet..." -ForegroundColor Cyan
$ContractId = stellar contract deploy --wasm "$WasmPath" --source polaris-admin --network testnet
Write-Host "Contract deployed: $ContractId" -ForegroundColor Green

$AdminAddr = stellar keys address polaris-admin
Write-Host "Initializing contract with admin $AdminAddr..." -ForegroundColor Cyan
stellar contract invoke --id "$ContractId" --source polaris-admin --network testnet -- initialize --admin "$AdminAddr"
Write-Host "Contract successfully initialized on Testnet!" -ForegroundColor Green
