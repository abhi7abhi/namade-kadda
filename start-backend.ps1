# Launch Namade Kadda FastAPI Backend
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Namade Kadda FastAPI Backend... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir

# Run DB migration and seeds
Write-Host "Verifying database migrations and seeds..." -ForegroundColor Yellow
python -m alembic upgrade head
python -m app.seed.seed_data

Write-Host "Starting Uvicorn Server on http://127.0.0.1:8000 (Docs at /docs)..." -ForegroundColor Green
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
