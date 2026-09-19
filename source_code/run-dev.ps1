# =====================================================================
# BanquetHub - Script khoi chay toan bo he thong local (Windows PowerShell)
# =====================================================================

$root = $PSScriptRoot

Write-Host "=== BANQUETHUB LOCAL DEV STARTUP ===" -ForegroundColor Cyan

# 1. Kiem tra va khoi dong PostgreSQL 17 neu chua bat
Write-Host "`n[1/3] Kiem tra Docker PostgreSQL 17..." -ForegroundColor Yellow
docker compose -f "$root\infra\docker-compose.yml" up -d

# 2. Bat Spring Boot Backend o cua so PowerShell rieng
Write-Host "[2/3] Dang bat Spring Boot Backend (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- BANQUETHUB BACKEND (SPRING BOOT :8080) ---' -ForegroundColor Yellow; Set-Location '$root\backend'; .\mvnw.cmd spring-boot:run"

# 3. Bat React Frontend o cua so PowerShell rieng
Write-Host "[3/3] Dang bat React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- BANQUETHUB FRONTEND (REACT VITE :5173) ---' -ForegroundColor Green; Set-Location '$root\frontend'; npm run dev"

Write-Host "`n>>> Da khoi dong ca 2 tien trinh tren 2 cua so rieng biet!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend API: http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "  - Swagger UI: http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "  - Health Check: http://localhost:8080/api/v1/health" -ForegroundColor White

