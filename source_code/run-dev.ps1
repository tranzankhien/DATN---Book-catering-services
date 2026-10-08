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

# Dong bo .env sang backend/.env va infra/.env de dam bao moi service luon khop mat khau
Copy-Item "$root\.env" "$root\backend\.env" -Force
Copy-Item "$root\.env" "$root\infra\.env" -Force

# Doc POSTGRES_PASSWORD tu .env
$dbPass = "BanquetHub_Local_2026!"
if (Test-Path "$root\.env") {
    $envLines = Get-Content "$root\.env"
    foreach ($line in $envLines) {
        if ($line -match "^POSTGRES_PASSWORD=(.+)$") {
            $dbPass = $matches[1].Trim()
        }
    }
}

# 1. Kiem tra Docker Engine dang chay
Write-Host "`n[1/4] Kiem tra Docker Desktop..." -ForegroundColor Yellow
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[LOI NGHIEP TRONG] Docker Desktop chua duoc bat hoac dang khoi dong do dang!" -ForegroundColor Red
    Write-Host "-> Huong dan xu ly:" -ForegroundColor Yellow
    Write-Host "   1. Mo ung dung Docker Desktop tren Windows." -ForegroundColor White
    Write-Host "   2. Doi bieu tuong Docker (con ca voi o goc phai man hinh) hien mau XANH LA (Engine running)." -ForegroundColor White
    Write-Host "   3. Chay lai lenh: .\run-dev.ps1" -ForegroundColor White
    Write-Host "`nNhan phim bat ky de thoat..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Khoi dong PostgreSQL 17
Write-Host "  -> Dang khoi dong container PostgreSQL 17..." -ForegroundColor Cyan
docker compose -f "$root\infra\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LOI] Khong the khoi dong container PostgreSQL 17." -ForegroundColor Red
    exit 1
}

# Doi PostgreSQL 17 san sang nhan ket noi (Health check)
Write-Host "  -> Dang doi PostgreSQL 17 san sang nhan ket noi..." -ForegroundColor Cyan
$pgReady = $false
for ($i = 1; $i -le 25; $i++) {
    $status = docker compose -f "$root\infra\docker-compose.yml" exec -T postgres pg_isready -U banquet_user -d banquet_hub 2>&1
    if ($status -match "accepting connections") {
        $pgReady = $true
        Write-Host "  -> PostgreSQL 17 da san sang!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    Write-Host "     (Dang doi DB khoi tao... ${i}s)" -ForegroundColor Gray
}

# Kiem tra xac thuc mat khau: Neu volume cu tao truoc do co password khac, tu dong reset volume
$authCheck = docker compose -f "$root\infra\docker-compose.yml" exec -T -e PGPASSWORD=$dbPass postgres psql -U banquet_user -d banquet_hub -c "SELECT 1;" 2>&1
if ($authCheck -match "password authentication failed") {
    Write-Host "`n[CANH BAO] Phat hien Database volume cu co mat khau khong khop!" -ForegroundColor Yellow
    Write-Host "  -> Dang tu dong reset volume database de dong bo mat khau moi..." -ForegroundColor Cyan
    docker compose -f "$root\infra\docker-compose.yml" down -v
    docker compose -f "$root\infra\docker-compose.yml" up -d
    Start-Sleep -Seconds 5
    Write-Host "  -> Da reset database thanh cong voi mat khau chuan tu .env!" -ForegroundColor Green
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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:SPRING_DATASOURCE_PASSWORD='$dbPass'; `$env:SPRING_DATASOURCE_USERNAME='banquet_user'; Write-Host '--- BANQUETHUB BACKEND (SPRING BOOT :8080) ---' -ForegroundColor Yellow; Set-Location '$root\backend'; .\mvnw.cmd spring-boot:run"

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
