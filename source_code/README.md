# BanquetHub – Nền tảng Đặt Tiệc Tích Hợp Quản Lý Cơ Sở Kinh Doanh (MVP)

Hệ thống **BanquetHub** là nền tảng đặt tiệc trực tuyến tích hợp quản lý cơ sở kinh doanh theo kiến trúc **Modular Monolith**, phát triển theo đặc tả yêu cầu phần mềm **`docs/SRS_MVP.docx` (`SRS-PARTY-001`)**.

---

## 1. Công nghệ sử dụng

| Tầng | Công nghệ & Phiên bản |
|------|----------------------|
| **Backend** | Java 21 (bytecode target), Spring Boot `3.5.16`, Spring Web, Spring Security (JWT + BCrypt), Spring Data JPA, Bean Validation, Spring Boot Actuator, SpringDoc OpenAPI `2.8.17` |
| **Database & Migration** | PostgreSQL `17` (Docker Compose), Flyway Migration (`ddl-auto=validate`) |
| **Frontend** | React `19` + TypeScript `5.8` + Vite `6`, React Router `7`, Axios, Tailwind CSS `4`, Lucide Icons |
| **Testing** | JUnit 5, Spring Boot Test, MockMvc |

---

## 2. Cấu trúc thư mục Monorepo

```text
banquet-hub/
├── backend/                  # Spring Boot REST API (com.banquethub)
│   ├── src/main/java/com/banquethub/
│   │   ├── common/           # Config, Security (JWT), GlobalExceptionHandler, ApiResponse
│   │   └── modules/          # Các module nghiệp vụ (auth, users, catalog, ...)
│   ├── src/main/resources/
│   │   ├── application.yml   # Cấu hình Datasource, Flyway, JWT, Actuator
│   │   └── db/migration/     # V1__init_phase1_schema.sql, V2__seed_demo_catalog.sql
│   └── src/test/java/        # Kiểm thử tích hợp JUnit 5 (Phase1IntegrationTest)
├── frontend/                 # Ứng dụng React + TypeScript + Vite
│   └── src/
│       ├── app/              # AuthContext, ToastContext, App root
│       ├── components/       # LoadingState, ErrorState, EmptyState, DishStatusBadge
│       ├── features/admin/   # DishFormModal, RecipeConfigModal, IngredientFormModal
│       ├── hooks/            # useAuth, useToast, useFormatters (VND, UTC+7)
│       ├── layouts/          # PublicLayout, AdminLayout (Sidebar)
│       ├── pages/            # HomePage, CatalogPage, DishDetailPage, Login, Register, AdminCatalogPage
│       ├── routes/           # AppRouter, ProtectedRoute (Route Guard theo Role)
│       └── services/         # Axios apiClient, authService, catalogService
├── infra/
│   └── docker-compose.yml    # PostgreSQL 17 với persistent volume & healthcheck
├── docs/
│   ├── SRS_MVP.docx          # Tài liệu đặc tả yêu cầu phần mềm gốc (SRS-PARTY-001)
│   ├── ARCHITECTURE.md       # Kiến trúc hệ thống Modular Monolith
│   ├── DATABASE.md           # Thiết kế bảng và quan hệ CSDL Phase 1
│   ├── API.md                # Tài liệu đặc tả REST API Phase 1
│   └── ROADMAP.md            # Lộ trình 7 Phase triển khai theo SRS
├── .env.example              # Mẫu cấu hình biến môi trường (không chứa secret thật)
└── README.md                 # Hướng dẫn cài đặt và vận hành hệ thống
```

---

## 3. Yêu cầu môi trường (Windows 11 / PowerShell)

- **Java JDK**: Yêu cầu JDK 21+ (Nếu máy đang để `JAVA_HOME` ở JDK 17 nhưng đã cài `C:\Program Files\Java\jdk-21` hoặc `C:\Program Files\Java\jdk-24`, script `backend\mvnw.cmd` tự động chọn JDK 21+ cục bộ mà không làm thay đổi biến môi trường hệ thống. Nếu chưa có JDK 21+, tải bản chính thức tại [Eclipse Adoptium Temurin 21 LTS](https://adoptium.net/temurin/releases/?version=21)).
- **Node.js & npm**: Node.js `>= 20.x` (hiện tại `v24.19.0`), npm `>= 10.x`.
- **Docker Desktop**: Đang chạy để khởi tạo container PostgreSQL 17.
- **Git**: `>= 2.40`.

---

## 4. Hướng dẫn chạy toàn bộ hệ thống trên Windows (PowerShell)

### Bước 1: Tạo file biến môi trường `.env`

Tại thư mục gốc `banquet-hub`, sao chép `.env.example` sang `.env`, `infra/.env` và `frontend/.env` (nếu chưa có):

```powershell
Copy-Item .env.example .env
Copy-Item .env.example infra/.env
Copy-Item frontend/.env.example frontend/.env
```

*(Lưu ý: Mở `.env` và `infra/.env` để đặt mật khẩu local dev mong muốn cho `POSTGRES_PASSWORD`, `SPRING_DATASOURCE_PASSWORD` và `APP_JWT_SECRET`).*

### Bước 2: Khởi động PostgreSQL 17 bằng Docker Compose

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Kiểm tra trạng thái container:

```powershell
docker ps --filter "name=banquet-hub-postgres"
```

### Bước 3: Chạy Spring Boot Backend (Port 8080)

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Khi khởi động, Flyway tự động chạy migration `V1` (tạo schema) và `V2` (khởi tạo 5 danh mục, 12 nguyên liệu, 10 món ăn và 25 dòng công thức định lượng), đồng thời `DemoDataInitializer` tạo sẵn các tài khoản demo (không nhân bản khi khởi động lại).

### Bước 4: Chạy React Frontend (Port 5173)

Mở một cửa sổ PowerShell mới tại thư mục gốc `banquet-hub`:

```powershell
cd frontend
npm install
npm run dev
```

---

## 5. Địa chỉ các dịch vụ (URLs)

| Dịch vụ | Địa chỉ truy cập |
|---------|------------------|
| **React Frontend (Web UI)** | http://localhost:5173 |
| **Trang Quản trị Admin** | http://localhost:5173/admin/catalog |
| **Backend REST API Base URL** | http://localhost:8080/api/v1 |
| **API Health Check** | http://localhost:8080/api/v1/health |
| **Spring Boot Actuator Health** | http://localhost:8080/actuator/health |
| **Swagger UI / OpenAPI** | http://localhost:8080/swagger-ui.html |
| **PostgreSQL 17** | `localhost:5432` (Database: `banquet_hub`) |

---

## 6. Tài khoản Demo (Môi trường Local)

Các tài khoản demo được cấu hình thông qua biến môi trường (`APP_SEED_*` trong `.env`) và mã hóa mật khẩu bằng **BCrypt** khi khởi tạo:

| Vai trò | Email đăng nhập | Mật khẩu mặc định (Local) | Quyền hạn trong Phase 1 |
|---------|----------------|---------------------------|-------------------------|
| **Admin (`ROLE_ADMIN`)** | `admin@banquethub.vn` | `Admin@123` | Toàn quyền quản trị món ăn, danh mục, nguyên liệu và cấu hình công thức định lượng (`/admin/catalog`) |
| **Employee (`ROLE_EMPLOYEE`)** | `employee@banquethub.vn` | `Employee@123` | Tài khoản nhân viên điều phối (chuẩn bị cho Phase 3 xử lý tiến độ đơn tiệc) |
| **User (`ROLE_USER`)** | `user@banquethub.vn` | `User@123` | Tài khoản khách hàng đặt tiệc |

---

## 7. Kiểm thử tự động (Build & Test)

- **Chạy kiểm thử tích hợp Backend (JUnit 5 + MockMvc + PostgreSQL 17)**:
  ```powershell
  cd backend
  .\mvnw.cmd test
  ```
- **Kiểm tra kiểu TypeScript & Build Production cho Frontend**:
  ```powershell
  cd frontend
  npm run build
  ```

---

## 8. Xử lý lỗi thường gặp (Troubleshooting)

1. **Lỗi `Connection refused: localhost:5432` khi chạy Backend**:
   - Đảm bảo Docker Desktop đã bật và chạy lệnh `docker compose -f infra/docker-compose.yml up -d`.
2. **Lỗi `Password authentication failed for user` trên PostgreSQL**:
   - Đảm bảo giá trị `POSTGRES_PASSWORD` trong `infra/.env` trùng khớp với `SPRING_DATASOURCE_PASSWORD` trong `.env`.
3. **Lỗi `release version 21 not supported` nếu chạy `mvn` toàn cục**:
   - Máy đang trỏ biến `JAVA_HOME` hệ thống vào `jdk-17`. Luôn dùng `.\mvnw.cmd` trong thư mục `backend/` vì `mvnw.cmd` đã được cấu hình tự động nhận diện JDK 21/24 trong `C:\Program Files\Java\`.
