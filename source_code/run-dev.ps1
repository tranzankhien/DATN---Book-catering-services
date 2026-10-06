# =====================================================================
# BanquetHub - Script khoi chay toan bo he thong local (Windows PowerShell)
# =====================================================================

$root = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       BANQUETHUB - KHOI DONG HE THONG TOAN DIEN          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Kiem tra va tu dong tao file .env neu chua co
if (-not (Test-Path "$root\.env")) {
    Write-Host "`n[0/4] Chua co file .env, dang tu dong tao tu .env.example..." -ForegroundColor Yellow
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "  -> Da tao .env voi cau hinh local chuan!" -ForegroundColor Green
}

# 1. Kiem tra Docker Desktop & Khoi dong PostgreSQL 17
Write-Host "`n[1/4] Kiem tra Docker & Khoi dong PostgreSQL 17..." -ForegroundColor Yellow
try {
    docker compose -f "$root\infra\docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[CANH BAO] Docker chua bat hoac loi khoi dong. Vui long bat Docker Desktop!" -ForegroundColor Red
        pause
        exit 1
    }
} catch {
    Write-Host "[LOI] Khong the goi lenh docker. Vui long kiem tra Docker Desktop da duoc bat!" -ForegroundColor Red
    pause
    exit 1
}

# 2. Kiem tra dependencies cua Frontend (node_modules)
if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "`n[2/4] Chua cai dat thu vien Frontend, dang chay npm install..." -ForegroundColor Yellow
    Set-Location "$root\frontend"
    npm install
    Set-Location $root
    Write-Host "  -> Cai dat npm dependencies hoan tat!" -ForegroundColor Green
} else {
    Write-Host "`n[2/4] Thu vien Frontend da san sang." -ForegroundColor Green
}

# 3. Bat Spring Boot Backend o cua so PowerShell rieng (Port 8080)
Write-Host "`n[3/4] Dang bat Spring Boot Backend (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- BANQUETHUB BACKEND (SPRING BOOT :8080) ---' -ForegroundColor Yellow; Set-Location '$root\backend'; .\mvnw.cmd spring-boot:run"

# 4. Bat React Frontend o cua so PowerShell rieng (Port 5173)
Write-Host "`n[4/4] Dang bat React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- BANQUETHUB FRONTEND (REACT VITE :5173) ---' -ForegroundColor Green; Set-Location '$root\frontend'; npm run dev"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host ">>> DA KHOI DONG TOAN BO DICH VU THANH CONG!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  - Frontend (Giao dien): http://localhost:5173" -ForegroundColor White
Write-Host "  - Quan tri (Admin):     http://localhost:5173/admin/catalog" -ForegroundColor White
Write-Host "  - Backend REST API:     http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "  - Swagger API Docs:     http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "  - Health Check:         http://localhost:8080/api/v1/health" -ForegroundColor White
Write-Host "`nTai khoan demo:" -ForegroundColor Cyan
Write-Host "  - Admin:    admin@banquethub.vn    / Admin@123" -ForegroundColor Gray
Write-Host "  - Employee: employee@banquethub.vn / Employee@123" -ForegroundColor Gray
Write-Host "  - User:     user@banquethub.vn     / User@123" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green

