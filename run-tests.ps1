# Run Namade Kadda Automated Test Suite
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running Backend & Architecture Tests... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

python -m pytest tests/test_api.py -v
