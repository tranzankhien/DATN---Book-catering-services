# BanquetHub â€“ Ná»n táº£ng Äáº·t Tiá»‡c TÃ­ch Há»£p Quáº£n LÃ½ CÆ¡ Sá»Ÿ Kinh Doanh (MVP)

Há»‡ thá»‘ng **BanquetHub** lÃ  ná»n táº£ng Ä‘áº·t tiá»‡c trá»±c tuyáº¿n tÃ­ch há»£p quáº£n lÃ½ cÆ¡ sá»Ÿ kinh doanh theo kiáº¿n trÃºc **Modular Monolith**, phÃ¡t triá»ƒn theo Ä‘áº·c táº£ yÃªu cáº§u pháº§n má»m **`docs/SRS_MVP.docx` (`SRS-PARTY-001`)**.

---

## 1. CÃ´ng nghá»‡ sá»­ dá»¥ng

| Táº§ng | CÃ´ng nghá»‡ & PhiÃªn báº£n |
|------|----------------------|
| **Backend** | Java 21 (bytecode target), Spring Boot `3.5.16`, Spring Web, Spring Security (JWT + BCrypt), Spring Data JPA, Bean Validation, Spring Boot Actuator, SpringDoc OpenAPI `2.8.17` |
| **Database & Migration** | PostgreSQL `17` (Docker Compose), Flyway Migration (`ddl-auto=validate`) |
| **Frontend** | React `19` + TypeScript `5.8` + Vite `6`, React Router `7`, Axios, Tailwind CSS `4`, Lucide Icons |
| **Testing** | JUnit 5, Spring Boot Test, MockMvc |

---

## 2. Cáº¥u trÃºc thÆ° má»¥c Monorepo

```text
banquet-hub/
â”œâ”€â”€ backend/                  # Spring Boot REST API (com.banquethub)
â”‚   â”œâ”€â”€ src/main/java/com/banquethub/
â”‚   â”‚   â”œâ”€â”€ common/           # Config, Security (JWT), GlobalExceptionHandler, ApiResponse
â”‚   â”‚   â””â”€â”€ modules/          # CÃ¡c module nghiá»‡p vá»¥ (auth, users, catalog, ...)
â”‚   â”œâ”€â”€ src/main/resources/
â”‚   â”‚   â”œâ”€â”€ application.yml   # Cáº¥u hÃ¬nh Datasource, Flyway, JWT, Actuator
â”‚   â”‚   â””â”€â”€ db/migration/     # V1__init_phase1_schema.sql, V2__seed_demo_catalog.sql
â”‚   â””â”€â”€ src/test/java/        # Kiá»ƒm thá»­ tÃ­ch há»£p JUnit 5 (Phase1IntegrationTest)
â”œâ”€â”€ frontend/                 # á»¨ng dá»¥ng React + TypeScript + Vite
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ app/              # AuthContext, ToastContext, App root
â”‚       â”œâ”€â”€ components/       # LoadingState, ErrorState, EmptyState, DishStatusBadge
â”‚       â”œâ”€â”€ features/admin/   # DishFormModal, RecipeConfigModal, IngredientFormModal
â”‚       â”œâ”€â”€ hooks/            # useAuth, useToast, useFormatters (VND, UTC+7)
â”‚       â”œâ”€â”€ layouts/          # PublicLayout, AdminLayout (Sidebar)
â”‚       â”œâ”€â”€ pages/            # HomePage, CatalogPage, DishDetailPage, Login, Register, AdminCatalogPage
â”‚       â”œâ”€â”€ routes/           # AppRouter, ProtectedRoute (Route Guard theo Role)
â”‚       â””â”€â”€ services/         # Axios apiClient, authService, catalogService
â”œâ”€â”€ infra/
â”‚   â””â”€â”€ docker-compose.yml    # PostgreSQL 17 vá»›i persistent volume & healthcheck
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ SRS_MVP.docx          # TÃ i liá»‡u Ä‘áº·c táº£ yÃªu cáº§u pháº§n má»m gá»‘c (SRS-PARTY-001)
â”‚   â”œâ”€â”€ ARCHITECTURE.md       # Kiáº¿n trÃºc há»‡ thá»‘ng Modular Monolith
â”‚   â”œâ”€â”€ DATABASE.md           # Thiáº¿t káº¿ báº£ng vÃ  quan há»‡ CSDL Phase 1
â”‚   â”œâ”€â”€ API.md                # TÃ i liá»‡u Ä‘áº·c táº£ REST API Phase 1
â”‚   â””â”€â”€ ROADMAP.md            # Lá»™ trÃ¬nh 7 Phase triá»ƒn khai theo SRS
â”œâ”€â”€ .env.example              # Máº«u cáº¥u hÃ¬nh biáº¿n mÃ´i trÆ°á»ng (khÃ´ng chá»©a secret tháº­t)
â””â”€â”€ README.md                 # HÆ°á»›ng dáº«n cÃ i Ä‘áº·t vÃ  váº­n hÃ nh há»‡ thá»‘ng
```

---

## 3. Lá»±a chá»n cÃ¡ch cháº¡y há»‡ thá»‘ng

Há»‡ thá»‘ng há»— trá»£ 2 cÃ¡ch váº­n hÃ nh linh hoáº¡t tÃ¹y thuá»™c vÃ o má»¥c Ä‘Ã­ch sá»­ dá»¥ng trÃªn mÃ¡y cá»§a báº¡n:

* **CÃ¡ch 1: Cháº¡y Full Docker (KhuyÃªn dÃ¹ng khi mÃ¡y Ä‘Ã£ cÃ i Docker Desktop)**
  * **YÃªu cáº§u**: Chá»‰ cáº§n cÃ i **Docker Desktop** (khÃ´ng cáº§n cÃ i Java, khÃ´ng cáº§n cÃ i Node.js, khÃ´ng sá»£ xung Ä‘á»™t phiÃªn báº£n).
  * **Lá»‡nh cháº¡y**: 1 lá»‡nh duy nháº¥t khá»Ÿi Ä‘á»™ng toÃ n bá»™ DB + Backend + Frontend.
* **CÃ¡ch 2: Cháº¡y Local Dev (DÃ nh cho láº­p trÃ¬nh viÃªn muá»‘n code & hot-reload)**
  * **YÃªu cáº§u**: Docker Desktop + Java JDK 21+ + Node.js 20+.
  * **Lá»‡nh cháº¡y**: Script 1-click `.\run-dev.ps1`.

---

## 4. HÆ°á»›ng dáº«n chi tiáº¿t tá»«ng cÃ¡ch cháº¡y

### CÃ¡ch 1: Cháº¡y trá»n gÃ³i báº±ng Docker Desktop (Nhanh nháº¥t & MÆ°á»£t nháº¥t)

Náº¿u mÃ¡y Ä‘Ã£ cÃ³ sáºµn **Docker Desktop**:

1. **Báº­t Docker Desktop**.
2. Má»Ÿ terminal táº¡i thÆ° má»¥c gá»‘c `banquet-hub`, cháº¡y:
   ```powershell
   # Sao chÃ©p file cáº¥u hÃ¬nh máº«u (náº¿u chÆ°a cÃ³ .env)
   Copy-Item .env.example .env

   # Khá»Ÿi Ä‘á»™ng toÃ n bá»™: PostgreSQL 17 + Spring Boot API + React Vite
   docker compose -f infra/docker-compose.full.yml up -d --build
   ```
3. Truy cáº­p ngay:
   * **Giao diá»‡n Web (React)**: [http://localhost:5173](http://localhost:5173)
   * **Quáº£n trá»‹ Catalog & Kho**: [http://localhost:5173/admin/catalog](http://localhost:5173/admin/catalog)
   * **Swagger API Docs**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
   * **Health Check**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

*(Äá»ƒ dá»«ng toÃ n bá»™ dá»‹ch vá»¥: `docker compose -f infra/docker-compose.full.yml down`)*

---

### CÃ¡ch 2: Cháº¡y mÃ´i trÆ°á»ng Local Development (DÃ nh cho viá»‡c code tiáº¿p)

#### YÃªu cáº§u pháº§n má»m trÃªn mÃ¡y:
1. **Docker Desktop**: Äang báº­t (Ä‘á»ƒ cháº¡y container PostgreSQL 17).
2. **Java JDK 21+**: Táº£i báº£n chÃ­nh thá»©c [Eclipse Adoptium Temurin 21 LTS](https://adoptium.net/temurin/releases/?version=21) (chá»n file `.msi`, khi cÃ i nhá»› tÃ­ch chá»n *Set JAVA_HOME*).
3. **Node.js LTS (>= 20.x)**: Táº£i táº¡i [nodejs.org](https://nodejs.org/).

#### Khá»Ÿi cháº¡y báº±ng 1 lá»‡nh duy nháº¥t (One-click Startup):

Tá»« thÆ° má»¥c gá»‘c `banquet-hub`, má»Ÿ PowerShell vÃ  cháº¡y:

```powershell
.\run-dev.ps1
```

*Script `run-dev.ps1` sáº½ tá»± Ä‘á»™ng hoÃ n toÃ n:*
* *Tá»± kiá»ƒm tra vÃ  táº¡o file `.env` chuáº©n náº¿u mÃ¡y chÆ°a cÃ³.*
* *Tá»± khá»Ÿi Ä‘á»™ng container PostgreSQL 17 trong Docker.*
* *Tá»± cháº¡y `npm install` náº¿u thÆ° viá»‡n Frontend chÆ°a Ä‘Æ°á»£c táº£i.*
* *Tá»± Ä‘á»™ng má»Ÿ 2 cá»­a sá»• PowerShell riÃªng biá»‡t cho Backend (Port 8080) vÃ  Frontend (Port 5173).*

*(Náº¿u muá»‘n cháº¡y thá»§ cÃ´ng tá»«ng bÆ°á»›c:)*
1. `docker compose -f infra/docker-compose.yml up -d`
2. `cd backend; .\mvnw.cmd spring-boot:run`
3. `cd frontend; npm install; npm run dev`

---

## 5. Äá»‹a chá»‰ cÃ¡c dá»‹ch vá»¥ (URLs)

| Dá»‹ch vá»¥ | Äá»‹a chá»‰ truy cáº­p |
|---------|------------------|
| **React Frontend (Web UI)** | http://localhost:5173 |
| **Trang Quáº£n trá»‹ Admin** | http://localhost:5173/admin/catalog |
| **Backend REST API Base URL** | http://localhost:8080/api/v1 |
| **API Health Check** | http://localhost:8080/api/v1/health |
| **Spring Boot Actuator Health** | http://localhost:8080/actuator/health |
| **Swagger UI / OpenAPI** | http://localhost:8080/swagger-ui.html |
| **PostgreSQL 17** | `localhost:5433` (cổng host, tránh trùng PostgreSQL cài sẵn trên Windows) (Database: `banquet_hub`) |

---

## 6. TÃ i khoáº£n Demo (MÃ´i trÆ°á»ng Local)

CÃ¡c tÃ i khoáº£n demo Ä‘Æ°á»£c cáº¥u hÃ¬nh thÃ´ng qua biáº¿n mÃ´i trÆ°á»ng (`APP_SEED_*` trong `.env`) vÃ  mÃ£ hÃ³a máº­t kháº©u báº±ng **BCrypt** khi khá»Ÿi táº¡o:

| Vai trÃ² | Email Ä‘Äƒng nháº­p | Máº­t kháº©u máº·c Ä‘á»‹nh (Local) | Quyá»n háº¡n trong Phase 1 |
|---------|----------------|---------------------------|-------------------------|
| **Admin (`ROLE_ADMIN`)** | `admin@banquethub.vn` | `Admin@123` | ToÃ n quyá»n quáº£n trá»‹ mÃ³n Äƒn, danh má»¥c, nguyÃªn liá»‡u vÃ  cáº¥u hÃ¬nh cÃ´ng thá»©c Ä‘á»‹nh lÆ°á»£ng (`/admin/catalog`) |
| **Employee (`ROLE_EMPLOYEE`)** | `employee@banquethub.vn` | `Employee@123` | TÃ i khoáº£n nhÃ¢n viÃªn Ä‘iá»u phá»‘i (chuáº©n bá»‹ cho Phase 3 xá»­ lÃ½ tiáº¿n Ä‘á»™ Ä‘Æ¡n tiá»‡c) |
| **User (`ROLE_USER`)** | `user@banquethub.vn` | `User@123` | TÃ i khoáº£n khÃ¡ch hÃ ng Ä‘áº·t tiá»‡c |

---

## 7. Kiá»ƒm thá»­ tá»± Ä‘á»™ng & Báº£ng xÃ¡c minh dá»‹ch vá»¥ thá»±c táº¿

### 7.1. Cháº¡y kiá»ƒm thá»­ tá»± Ä‘á»™ng (Build & Unit/Integration Tests)

- **Cháº¡y kiá»ƒm thá»­ tÃ­ch há»£p Backend (JUnit 5 + MockMvc + PostgreSQL 17)**:
  ```powershell
  cd backend
  .\mvnw.cmd test
  ```
- **Kiá»ƒm tra kiá»ƒu TypeScript & Build Production cho Frontend**:
  ```powershell
  cd frontend
  npm run build
  ```

---

### 7.2. Báº£ng káº¿t quáº£ kiá»ƒm tra thá»±c táº¿ há»‡ thá»‘ng (Phase 1 & Phase 2 Verification)

| Háº¡ng má»¥c kiá»ƒm tra | Lá»‡nh thá»±c thi Ä‘Ãºng chuáº©n trÃªn PowerShell | Káº¿t quáº£ thá»±c táº¿ |
|-------------------|------------------------------------------|-----------------|
| **Khá»Ÿi táº¡o PostgreSQL 17** | `docker compose -f infra/docker-compose.yml up -d` | Container `banquet-hub-postgres` Ä‘áº¡t tráº¡ng thÃ¡i `running / healthy` trÃªn cá»•ng `5432` |
| **Cháº¡y JUnit 5 Integration Tests** | `cd backend; .\mvnw.cmd test` | `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0 â€” BUILD SUCCESS` ([Phase1IntegrationTest.java](backend/src/test/java/com/banquethub/Phase1IntegrationTest.java) & [Phase2IntegrationTest.java](backend/src/test/java/com/banquethub/Phase2IntegrationTest.java)) |
| **Build TypeScript & Vite Frontend** | `cd frontend; npm run build` | `tsc -b && vite build` thÃ nh cÃ´ng (`âœ“ built in ~3s`), 0 lá»—i |
| **Khá»Ÿi Ä‘á»™ng Live Services** | `.\run-dev.ps1`<br>*(hoáº·c má»Ÿ 2 tab: `cd backend; .\mvnw.cmd spring-boot:run` vÃ  `cd frontend; npm run dev`)* | Backend Spring Boot sáºµn sÃ ng táº¡i `:8080`, Frontend React Vite sáºµn sÃ ng táº¡i `:5173` |
| **Kiá»ƒm tra Live API & Health Endpoints** | `Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health"; (Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing).StatusCode` | `/api/v1/health` tráº£ `status: UP`, `database: PostgreSQL Connected`, `timezone: Asia/Ho_Chi_Minh`; Frontend tráº£ mÃ£ `200 OK` |
| **Xuáº¥t PDF Phiáº¿u Nháº­p A4** | Gá»i GET `/api/v1/admin/stock-receipts/{id}/pdf` | Tráº£ vá» `application/pdf` binary chuáº©n A4, hiá»ƒn thá»‹ tiáº¿ng Viá»‡t cÃ³ dáº¥u vá»›i bá»™ font Unicode Noto Sans SIL OFL |

---

## 8. Xá»­ lÃ½ lá»—i thÆ°á»ng gáº·p (Troubleshooting)

1. **Lá»—i `Connection refused: localhost:5433` khi cháº¡y Backend**:
   - Äáº£m báº£o Docker Desktop Ä‘Ã£ báº­t vÃ  cháº¡y lá»‡nh `docker compose -f infra/docker-compose.yml up -d`.
2. **Lá»—i `Password authentication failed for user` trÃªn PostgreSQL**:
   - Äáº£m báº£o giÃ¡ trá»‹ `POSTGRES_PASSWORD` trong `infra/.env` trÃ¹ng khá»›p vá»›i `SPRING_DATASOURCE_PASSWORD` trong `.env`.
3. **Lá»—i `release version 21 not supported` náº¿u cháº¡y `mvn` toÃ n cá»¥c**:
   - MÃ¡y Ä‘ang trá» biáº¿n `JAVA_HOME` há»‡ thá»‘ng vÃ o `jdk-17`. LuÃ´n dÃ¹ng `.\mvnw.cmd` trong thÆ° má»¥c `backend/` vÃ¬ `mvnw.cmd` Ä‘Ã£ Ä‘Æ°á»£c cáº¥u hÃ¬nh tá»± Ä‘á»™ng nháº­n diá»‡n JDK 21/24 trong `C:\Program Files\Java\`.


## Phase 4
Xem [cấu hình SePay Sandbox](docs/SEPAY_SETUP.md), [SMTP](docs/EMAIL_SETUP.md) và [luồng thanh toán](docs/PAYMENT_FLOW.md). Flyway cập nhật dữ liệu hiện có khi khởi động backend.


### Chọn địa điểm đặt tiệc
Checkout dùng Photon để gợi ý địa chỉ Việt Nam và OpenLayers với bản đồ OpenFreeMap. Có thể nhập tay, chọn gợi ý hoặc ghim. Tọa độ là tùy chọn và được lưu qua Flyway V13. Photon công cộng và OpenFreeMap phù hợp demo/lưu lượng nhỏ, không có cam kết dịch vụ. Có thể đặt VITE_PHOTON_URL và VITE_MAP_STYLE_URL trong frontend/.env để đổi máy chủ.


---

## 9. Phase 6 – Quản lý Nhân sự, Chấm công, Bảng lương & Chi trả (HR & Payroll)

Chi tiết đặc tả và quy trình xem tại:
- **Tài liệu đặc tả**: [`docs/HR_PAYROLL.md`](docs/HR_PAYROLL.md)
- **Quy trình trực quan**: [`docs/PAYROLL_WORKFLOW.md`](docs/PAYROLL_WORKFLOW.md)

### Các đường dẫn phân hệ Phase 6:
| Phân hệ | Đường dẫn Frontend | Mô tả chức năng |
|---|---|---|
| **Hồ sơ nhân sự** | `/admin/employees` | Quản lý danh bạ nhân sự, vị trí, ngày vào làm, mức lương cơ bản, liên kết user |
| **Bảng chấm công** | `/admin/attendance` | Ma trận chấm công toàn viện theo ngày (P = 1.0, H = 0.5, A = 0.0), khóa khi chốt sổ |
| **Kỳ tính lương** | `/admin/payroll-periods` | Thiết lập công chuẩn (26 ngày), dự toán lương, phụ cấp/khấu trừ, chốt sổ snapshot |
| **Bảng lương** | `/admin/payrolls` | Bảng lương chính thức bất biến, ghi nhận giải ngân (Tiền mặt / Chuyển khoản) |
| **Nhật ký chi trả** | `/admin/salary-payments` | Sổ cái theo dõi các giao dịch thanh toán lương toàn hệ thống |
| **Chấm công của tôi** | `/employee/attendance` | Nhân viên (`ROLE_EMPLOYEE`) tự tra cứu lịch sử chấm công cá nhân |
| **Phiếu lương của tôi** | `/employee/payrolls` | Nhân viên tự xem phiếu lương chính thức (Payslip) với đầy đủ chi tiết thu nhập |

### Kiểm thử hệ thống:
- **Backend**: `139 / 139` test cases tích hợp PASS 100% (gồm `39 / 39` test Phase 6 trong `Phase6HrPayrollIntegrationTest.java`).
- **Frontend**: Typecheck TypeScript và Vite build thành công 100% (0 lỗi).
