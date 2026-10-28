# Launch Namade Kadda Next.js Frontend
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Namade Kadda Next.js Frontend.. " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir

Write-Host "Starting Next.js Server on http://localhost:3000..." -ForegroundColor Green
npm run dev
