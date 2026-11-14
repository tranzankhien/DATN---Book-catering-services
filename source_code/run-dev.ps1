# =====================================================================
# BanquetHub - Script khoi chay toan bo he thong local (Windows PowerShell)
# =====================================================================
# Luu y: file nay chi dung ky tu ASCII de PowerShell 5.1 doc dung.

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot
$composeFile = "$root\infra\docker-compose.yml"

function Fail($msg) {
    Write-Host "`n[LOI] $msg" -ForegroundColor Red
    Write-Host "Nhan phim bat ky de thoat..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       BANQUETHUB - KHOI DONG HE THONG LOCAL              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------
# 0. Chuan bi file .env (tao moi hoac nang cap file cu)
# ---------------------------------------------------------------------
if (-not (Test-Path "$root\.env")) {
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "[0/5] Da tao .env tu .env.example" -ForegroundColor Green
} else {
    $content = Get-Content "$root\.env" -Raw
    $original = $content
    # Thay cac gia tri mau cu
    $content = $content -replace "CHANGE_ME_LOCAL_DEV_PASSWORD", "BanquetHub_Local_2026!"
    $content = $content -replace "CHANGE_ME_WITH_AT_LEAST_32_BYTES_SECRET_KEY_FOR_HS256", "BanquetHub_Local_Jwt_Secret_Key_2026_For_HS256_Signing_Min32Bytes"
    $content = $content -replace "CHANGE_ME_ADMIN_DEMO_PASSWORD", "Admin@123"
    $content = $content -replace "CHANGE_ME_EMPLOYEE_DEMO_PASSWORD", "Employee@123"
    $content = $content -replace "CHANGE_ME_USER_DEMO_PASSWORD", "User@123"
    # Chuyen cong cu 5432 -> 5433 (tranh dung do PostgreSQL cai san tren Windows)
    $content = $content -replace "(?m)^POSTGRES_PORT=5432\s*$", "POSTGRES_PORT=5433"
    $content = $content -replace "localhost:5432/", "localhost:5433/"
    if ($content -ne $original) {
        Set-Content -Path "$root\.env" -Value $content -NoNewline
        Write-Host "[0/5] Da nang cap .env cu (mat khau mau / cong 5433)" -ForegroundColor Green
    } else {
        Write-Host "[0/5] File .env da san sang" -ForegroundColor Green
    }
}

# Doc .env thanh bang tra cuu
$cfg = @{}
foreach ($line in Get-Content "$root\.env") {
    if ($line -match "^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$") { $cfg[$matches[1]] = $matches[2].Trim() }
}
$dbName = if ($cfg.POSTGRES_DB) { $cfg.POSTGRES_DB } else { "banquet_hub" }
$dbUser = if ($cfg.POSTGRES_USER) { $cfg.POSTGRES_USER } else { "banquet_user" }
$dbPass = if ($cfg.POSTGRES_PASSWORD) { $cfg.POSTGRES_PASSWORD } else { "BanquetHub_Local_2026!" }
$dbPort = if ($cfg.POSTGRES_PORT) { $cfg.POSTGRES_PORT } else { "5433" }
$jdbcUrl = "jdbc:postgresql://localhost:$dbPort/$dbName"

Copy-Item "$root\.env" "$root\infra\.env" -Force
Copy-Item "$root\.env" "$root\backend\.env" -Force

# ---------------------------------------------------------------------
# 1. Docker Desktop phai dang chay
# ---------------------------------------------------------------------
Write-Host "`n[1/5] Kiem tra Docker Desktop..." -ForegroundColor Yellow
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Fail "Docker Desktop chua chay. Hay mo Docker Desktop, doi bieu tuong chuyen xanh (Engine running) roi chay lai .\run-dev.ps1"
}
Write-Host "  -> Docker dang chay" -ForegroundColor Green

# ---------------------------------------------------------------------
# 2. Kiem tra cong DB: khong duoc co chuong trinh KHAC Docker chiem cong
# ---------------------------------------------------------------------
Write-Host "`n[2/5] Kiem tra cong PostgreSQL $dbPort..." -ForegroundColor Yellow
$dockerProcs = @("com.docker.backend", "com.docker.proxy", "vpnkit", "wslrelay", "docker-proxy", "com.docker.vpnkit")
$listeners = Get-NetTCPConnection -LocalPort $dbPort -State Listen -ErrorAction SilentlyContinue
foreach ($l in $listeners) {
    $p = Get-Process -Id $l.OwningProcess -ErrorAction SilentlyContinue
    if ($p -and ($dockerProcs -notcontains $p.ProcessName)) {
        Fail ("Cong $dbPort dang bi chuong trinh '" + $p.ProcessName + "' (PID " + $p.Id + ") chiem. " +
              "Hay doi POSTGRES_PORT va SPRING_DATASOURCE_URL trong file .env sang cong khac (vd 5434) roi chay lai.")
    }
}
# Thong tin: phat hien PostgreSQL cai truc tiep tren Windows (nguyen nhan loi password cu)
$native = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "postgresql*" -and $_.Status -eq "Running" }
if ($native) {
    Write-Host ("  -> Luu y: may co PostgreSQL cai san (" + ($native.Name -join ", ") + ") dang chay o cong 5432. " +
                "Du an dung cong $dbPort nen khong bi anh huong.") -ForegroundColor DarkYellow
}
Write-Host "  -> Cong $dbPort hop le" -ForegroundColor Green

# ---------------------------------------------------------------------
# 3. Khoi dong PostgreSQL 17 + dong bo mat khau
# ---------------------------------------------------------------------
Write-Host "`n[3/5] Khoi dong PostgreSQL 17 (Docker)..." -ForegroundColor Yellow
docker compose -f $composeFile up -d
if ($LASTEXITCODE -ne 0) { Fail "Khong khoi dong duoc container PostgreSQL." }

$ready = $false
for ($i = 1; $i -le 30; $i++) {
    docker compose -f $composeFile exec -T postgres pg_isready -U $dbUser -d $dbName *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) { Fail "PostgreSQL khong san sang sau 30 giay. Xem log: docker logs banquet-hub-postgres" }

# Dong bo mat khau trong DB voi .env (qua socket noi bo, khong can mat khau).
# Giai quyet truong hop volume cu duoc tao voi mat khau khac.
$sqlPass = $dbPass.Replace("'", "''")
docker compose -f $composeFile exec -T postgres psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c "ALTER USER $dbUser WITH PASSWORD '$sqlPass';" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  -> Canh bao: Khong the cap nhat mat khau cho user '$dbUser'. Vui long kiem tra file .env." -ForegroundColor Yellow
    Write-Host "  -> Luu y: He thong khong tu y xoa volume du lieu. Neu can reset toan bo database, vui long chay: docker compose -f $composeFile down -v" -ForegroundColor Yellow
} else {
    Write-Host "  -> PostgreSQL san sang tai localhost:$dbPort, mat khau da dong bo voi .env" -ForegroundColor Green
}

# ---------------------------------------------------------------------
# 4. Thu vien Frontend
# ---------------------------------------------------------------------
if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "`n[4/5] Cai thu vien Frontend (npm install)..." -ForegroundColor Yellow
    Push-Location "$root\frontend"; npm install; Pop-Location
} else {
    Write-Host "`n[4/5] Thu vien Frontend da san sang" -ForegroundColor Green
}

# ---------------------------------------------------------------------
# 5. Bat Backend + Frontend (truyen thang bien moi truong cho Backend)
# ---------------------------------------------------------------------
Write-Host "`n[5/5] Bat Backend (:8080) va Frontend (:5173)..." -ForegroundColor Yellow
$psPass = $dbPass.Replace("'", "''")
$backendCmd = "`$env:SPRING_DATASOURCE_URL='$jdbcUrl'; `$env:SPRING_DATASOURCE_USERNAME='$dbUser'; `$env:SPRING_DATASOURCE_PASSWORD='$psPass'; " +
              "Write-Host '--- BANQUETHUB BACKEND (SPRING BOOT :8080) -> $jdbcUrl ---' -ForegroundColor Yellow; " +
              "Set-Location '$root\backend'; .\mvnw.cmd spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- BANQUETHUB FRONTEND (VITE :5173) ---' -ForegroundColor Green; Set-Location '$root\frontend'; npm run dev"

# Doi Backend len that su roi moi bao thanh cong
Write-Host "  -> Dang doi Backend khoi dong (toi da 120 giay)..." -ForegroundColor Cyan
$up = $false
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -TimeoutSec 2
        if ($r) { $up = $true; break }
    } catch { }
}

if ($up) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host ">>> HE THONG DA CHAY THANH CONG" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "`n[CANH BAO] Backend chua phan hoi sau 120 giay. Xem loi trong cua so BACKEND." -ForegroundColor Red
}
Write-Host "  - Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "  - Admin:        http://localhost:5173/admin/catalog" -ForegroundColor White
Write-Host "  - Backend API:  http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "  - Swagger:      http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "`nTai khoan demo:" -ForegroundColor Cyan
Write-Host "  - Admin:    admin@banquethub.vn    / Admin@123" -ForegroundColor Gray
Write-Host "  - Employee: employee@banquethub.vn / Employee@123" -ForegroundColor Gray
Write-Host "  - User:     user@banquethub.vn     / User@123" -ForegroundColor Gray
