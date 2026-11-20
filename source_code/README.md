# BanquetHub – Nền tảng Đặt Tiệc Tích Hợp Quản Lý Cơ Sở Kinh Doanh (MVP)

Hệ thống **BanquetHub** là nền tảng đặt tiệc trực tuyến tích hợp quản lý cơ sở kinh doanh theo kiến trúc **Modular Monolith**, phát triển theo đặc tả yêu cầu phần mềm **`docs/SRS_MVP.docx` (`SRS-PARTY-001`)**.

---

## 1. Công nghệ sử dụng

| Tầng | Công nghệ & Phiên bản |
|------|----------------------|
| **Backend** | Java 21 (bytecode target), Spring Boot `3.5.16`, Spring Web, Spring Security (JWT + BCrypt), Spring Data JPA, Bean Validation, Spring Boot Actuator, SpringDoc OpenAPI `2.8.17` |
| **Database & Migration** | PostgreSQL `17` (Docker Compose), Flyway Migration (`ddl-auto=validate`) |
| **Frontend** | React `19` + TypeScript `5.8` + Vite `6`, React Router `7`, Axios, Tailwind CSS `4`, Lucide Icons |
| **Cổng thanh toán** | VNPAY Sandbox & SePay Sandbox, Webhook IPN đối soát giao dịch tự động |
| **Trí tuệ nhân tạo** | Google Gemini API (Gợi ý thực đơn tiệc, phân tích ngân sách & khẩu vị) |
| **Testing** | JUnit 5, Spring Boot Test, MockMvc (Toàn bộ 169 integration test cases PASS 100%) |

---

## 2. Cấu trúc thư mục Monorepo

```text
banquet-hub/
├── backend/                  # Spring Boot REST API (com.banquethub)
│   ├── src/main/java/com/banquethub/
│   │   ├── common/           # Config, Security (JWT), GlobalExceptionHandler, ApiResponse
│   │   └── modules/          # Các module nghiệp vụ:
│   │       ├── auth/         # Xác thực JWT, đăng ký, đăng nhập
│   │       ├── users/        # Quản lý tài khoản, phân quyền RBAC, hồ sơ cá nhân
│   │       ├── catalog/      # Danh mục món ăn, danh mục phân loại, công thức định lượng
│   │       ├── inventory/    # Quản lý nguyên liệu, nhà cung cấp, nhập kho, giá vốn bình quân
│   │       ├── orders/       # Menu builder, đặt tiệc, giữ chỗ tồn kho, quản lý tiến độ
│   │       ├── payments/     # Giao dịch thanh toán VNPAY/SePay, xác thực IPN, trừ kho tiêu hao
│   │       ├── ai/           # Trợ lý Gemini AI gợi ý thực đơn, kiểm tra ngân sách & tồn kho
│   │       ├── employees/    # Hồ sơ nhân viên, chấm công theo ngày, phụ cấp, chốt sổ bảng lương
│   │       └── reports/      # Dashboard quản trị, doanh thu thực thu, chi phí vận hành, P&L, dòng tiền
│   ├── src/main/resources/
│   │   ├── application.yml   # Cấu hình Datasource, Flyway, JWT, Actuator, SePay, Gemini
│   │   └── db/migration/     # V1 -> V21 Flyway SQL migrations
│   └── src/test/java/        # 169 integration test cases kiểm thử tự động toàn diện
├── frontend/                 # Ứng dụng React + TypeScript + Vite
│   └── src/
│       ├── app/              # AuthContext, ToastContext, Root App
│       ├── components/       # StatusStates, Logo, OrderProgress, MapLocationPicker
│       ├── hooks/            # useAuth, useToast, useFormatters (VND, UTC+7)
│       ├── layouts/          # PublicLayout, AdminLayout (Sidebar Navigation)
│       ├── pages/            # HomePage, CatalogPage, MenuBuilderPage, AiMenuPage, MyOrdersPage...
│       │   ├── admin/        # AdminDashboardPage, AdminUsersPage, AdminEmployeesPage, Reports...
│       │   └── employee/     # EmployeeOrdersPage, EmployeeMyAttendancePage, EmployeeMyPayrollsPage...
│       ├── routes/           # AppRouter, ProtectedRoute (Route Guard theo Role)
│       └── services/         # Axios apiClient, authService, userService, reportService...
├── infra/
│   ├── docker-compose.yml    # PostgreSQL 17 độc lập (Port host 5433)
│   └── docker-compose.full.yml # Full stack: PostgreSQL 17 + Spring Boot API + React Vite
├── docs/                     # Toàn bộ tài liệu kiến trúc, database, API và quy trình nghiệp vụ
├── .env.example              # Mẫu cấu hình biến môi trường
├── run-dev.ps1               # Script 1-click khởi chạy môi trường dev tự động
└── README.md                 # Tài liệu hướng dẫn cài đặt và vận hành hệ thống
```

---

## 3. Tổng quan các Phase đã hoàn thiện

- **Phase 1 – Foundation:** Xác thực Spring Security + JWT, phân quyền 3 cấp độ (`ROLE_USER`, `ROLE_EMPLOYEE`, `ROLE_ADMIN`), danh mục món ăn và công thức định lượng nguyên liệu chuẩn 1 bàn.
- **Phase 2 – Inventory:** Quản lý nguyên vật liệu, nhà cung cấp, lập phiếu nhập kho, xuất PDF phiếu nhập chuẩn A4 tiếng Việt Unicode, tính giá vốn bình quân di động (Moving Weighted Average) và cảnh báo tồn kho an toàn.
- **Phase 3 – Ordering:** Trình tự phối thực đơn (Menu Builder), danh mục thực đơn mẫu định sẵn, đặt tiệc theo số bàn, cơ chế giữ chỗ tồn kho (Stock Reservation 15 phút) và theo dõi trạng thái đơn hàng.
- **Phase 4 – Payment & Workflow:** Tích hợp cổng thanh toán Sandbox (VNPAY / SePay), xác thực IPN chống gian lận và chống xử lý trùng lặp, trừ kho tiêu hao nguyên liệu sau khi thanh toán, ghi nhận giá vốn COGS thực tế, gửi email xác nhận đặt tiệc tự động, bản đồ định vị địa điểm tổ chức tiệc (Photon + OpenFreeMap) và quy trình điều phối bếp.
- **Phase 5 – AI Assistant:** Trợ lý Gemini AI gợi ý thực đơn tiệc thông minh dựa trên mô tả ngôn ngữ tự nhiên, tự động trích xuất số bàn, số khách, ngân sách, kiểm tra mức độ sẵn sàng của nguyên vật liệu trong kho và chuyển đổi sang Menu Builder chỉ với 1 click.
- **Phase 6 – HR & Payroll:** Quản lý danh bạ hồ sơ nhân viên, ma trận chấm công toàn viện theo ngày (P = 1.0, H = 0.5, A = 0.0), thiết lập kỳ tính lương với công chuẩn 26 ngày, phụ cấp và khấu trừ, dự toán lương, chốt sổ bảng lương snapshot bất biến, ghi nhận giải ngân tiền lương và cổng tự tra cứu phiếu lương cá nhân cho nhân viên.
- **Phase 7 – Business Dashboard & Financial Reporting:** Dashboard quản trị hiệu quả kinh doanh, doanh thu thực thu theo ngày thanh toán, giá vốn nguyên liệu tiêu hao (COGS), chi phí lương đã chốt, quản lý chi phí vận hành khác (Operating Expenses), báo cáo lợi nhuận ước tính (EBITDA / P&L), báo cáo lưu chuyển tiền tệ (Cash Flow) và xuất dữ liệu báo cáo sang tệp CSV Excel (chuẩn UTF-8 BOM).
- **Quản lý Tài khoản & Bảo mật (User Management):** Phân hệ quản trị tài khoản người dùng cho Admin (tìm kiếm, lọc vai trò/trạng thái, phân quyền, khóa/mở khóa tức thì qua JWT, đặt lại mật khẩu an toàn, liên kết hồ sơ nhân sự) cùng trang quản lý hồ sơ cá nhân và đổi mật khẩu bảo mật cho người dùng.

---

## 4. Hướng dẫn khởi chạy hệ thống

### Cách 1: Khởi chạy 1-Click bằng PowerShell (Khuyên dùng cho Windows Local Dev)

Từ thư mục gốc `banquet-hub`, mở PowerShell và thực thi:

```powershell
.\run-dev.ps1
```

*Script `run-dev.ps1` sẽ thực hiện tự động toàn bộ quy trình:*
1. Tự kiểm tra và tạo file `.env` chuẩn nếu máy chưa có.
2. Tự khởi động container PostgreSQL 17 trên Docker (Port 5433).
3. Tự cài đặt dependencies Frontend (`npm install`) nếu chưa có thư mục `node_modules`.
4. Tự động mở 2 cửa sổ terminal riêng biệt cho **Backend API** (Port 8080) và **Frontend Vite** (Port 5173).

---

### Cách 2: Khởi chạy thủ công từng dịch vụ

1. **Khởi chạy Cơ sở dữ liệu PostgreSQL 17:**
   ```powershell
   docker compose -f infra/docker-compose.yml up -d
   ```
2. **Khởi chạy Backend (Spring Boot API):**
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
3. **Khởi chạy Frontend (React Vite):**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

---

### Cách 3: Chạy trọn gói toàn bộ bằng Docker Desktop (Full Docker Stack)

Nếu muốn chạy toàn bộ hệ thống bằng Docker mà không cần cài đặt JDK hay Node.js trên máy:

```powershell
# Tạo file cấu hình từ template mẫu
Copy-Item .env.example .env

# Khởi động PostgreSQL 17 + Spring Boot + Frontend
docker compose -f infra/docker-compose.full.yml up -d --build
```

*(Để dừng toàn bộ dịch vụ: `docker compose -f infra/docker-compose.full.yml down`)*

---

## 5. Địa chỉ truy cập các dịch vụ (URLs)

| Dịch vụ | Địa chỉ truy cập | Ghi chú |
|---------|------------------|---------|
| **Giao diện Web (React UI)** | [http://localhost:5173](http://localhost:5173) | Cổng thông tin & đặt tiệc cho khách hàng |
| **Gợi ý thực đơn AI** | [http://localhost:5173/ai-menu](http://localhost:5173/ai-menu) | Trợ lý Gemini AI xây dựng thực đơn tiệc |
| **Bảng điều khiển Admin (Dashboard)** | [http://localhost:5173/admin/dashboard](http://localhost:5173/admin/dashboard) | Thống kê doanh thu, chi phí, lợi nhuận Phase 7 |
| **Quản lý tài khoản Admin** | [http://localhost:5173/admin/users](http://localhost:5173/admin/users) | Phân quyền, khóa tài khoản, reset mật khẩu |
| **Quản lý danh mục & Kho** | [http://localhost:5173/admin/catalog](http://localhost:5173/admin/catalog) | Món ăn, công thức định lượng, nguyên liệu |
| **Quản lý nhân sự & Bảng lương** | [http://localhost:5173/admin/employees](http://localhost:5173/admin/employees) | Hồ sơ nhân viên, chấm công, bảng lương |
| **Backend REST API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Endpoint gốc cho API |
| **Kiểm tra trạng thái (Health Check)** | [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) | Trả về trạng thái DB, Timezone, Uptime |
| **Tài liệu Swagger / OpenAPI** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Tài liệu tra cứu & kiểm thử API trực quan |
| **Cơ sở dữ liệu PostgreSQL 17** | `localhost:5433` (DB: `banquet_hub`) | Cổng host 5433 tránh trùng PostgreSQL local |

---

## 6. Tài khoản trải nghiệm mẫu (Demo Accounts)

Hệ thống tích hợp sẵn các tài khoản thử nghiệm được mã hóa mật khẩu bằng BCrypt:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Quyền hạn chính |
|---|---|---|---|
| **Quản trị viên (`ROLE_ADMIN`)** | `admin@banquethub.vn` | `Admin@123` | Toàn quyền quản trị hệ thống, Dashboard kinh doanh, kho bãi, nhân sự, bảng lương và quản lý tài khoản |
| **Nhân viên (`ROLE_EMPLOYEE`)** | `employee@banquethub.vn` | `Employee@123` | Truy cập lịch điều phối bếp, bảng chấm công cá nhân và phiếu lương của tôi |
| **Khách hàng (`ROLE_USER`)** | `user@banquethub.vn` | `User@123` | Xem thực đơn, sử dụng AI gợi ý món, tự phối thực đơn, đặt tiệc và theo dõi đơn hàng |

*(Trên trang Đăng nhập `http://localhost:5173/login`, hệ thống có sẵn các nút bấm điền nhanh tài khoản trải nghiệm một chạm cho từng vai trò).*

---

## 7. Kiểm thử tự động & Nghiệm thu chất lượng

### 7.1. Chạy bộ kiểm thử Backend (JUnit 5 + MockMvc)
```powershell
cd backend
.\mvnw.cmd test
```
*Kết quả:* **169 / 169 test cases PASS 100%** (Bao gồm đầy đủ test tích hợp cho các Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Quản lý tài khoản và SePay).

### 7.2. Kiểm tra kiểu & Build Production Frontend (TypeScript + Vite)
```powershell
cd frontend
npm run build
```
*Kết quả:* Typecheck TypeScript và Vite build thành công 100% (0 lỗi, tạo bundle `dist/` hoàn chỉnh).

---

## 8. Xử lý các vấn đề thường gặp (Troubleshooting)

1. **Lỗi `Connection refused: localhost:5433` khi chạy Backend:**
   - Đảm bảo Docker Desktop đã được bật và container PostgreSQL đang chạy bằng lệnh: `docker compose -f infra/docker-compose.yml up -d`.
2. **Lỗi `Password authentication failed for user` trên PostgreSQL:**
   - Kiểm tra giá trị `POSTGRES_PASSWORD` trong file `.env` phải trùng khớp với mật khẩu kết nối của Spring Boot Datasource.
3. **Lỗi `release version 21 not supported` nếu chạy `mvn` toàn cục:**
   - Máy tính có thể đang trỏ biến `JAVA_HOME` hệ thống vào JDK cũ. Hãy luôn dùng wrapper `.\mvnw.cmd` trong thư mục `backend/` vì script đã được cấu hình tự động nhận diện JDK 21 trở lên.
4. **Cổng PostgreSQL 5433:**
   - Để tránh xung đột với các phiên bản PostgreSQL 5432 cài trực tiếp trên Windows của người dùng, dự án BanquetHub sử dụng cổng chuyển tiếp `5433:5432` cho container Docker.

---

## 9. Danh mục tài liệu tham khảo chi tiết (`docs/`)

- [`docs/SRS_MVP.docx`](docs/SRS_MVP.docx): Đặc tả yêu cầu phần mềm gốc (`SRS-PARTY-001`).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Kiến trúc hệ thống Modular Monolith và ranh giới các module.
- [`docs/DATABASE.md`](docs/DATABASE.md): Thiết kế thực thể, lược đồ bảng CSDL và quan hệ qua các Phase.
- [`docs/API.md`](docs/API.md): Đặc tả chi tiết các REST API endpoints trong hệ thống.
- [`docs/ORDER_WORKFLOW.md`](docs/ORDER_WORKFLOW.md): Quy trình luồng đơn tiệc và cơ chế giữ chỗ tồn kho.
- [`docs/PAYMENT_FLOW.md`](docs/PAYMENT_FLOW.md): Quy trình thanh toán, xử lý IPN và xuất kho tiêu hao.
- [`docs/AI_RECOMMENDATION.md`](docs/AI_RECOMMENDATION.md): Cơ chế prompt engineering và phân tích thực đơn bằng Gemini.
- [`docs/HR_PAYROLL.md`](docs/HR_PAYROLL.md): Quy tắc nghiệp vụ quản lý nhân sự, chấm công và tính lương.
- [`docs/PAYROLL_WORKFLOW.md`](docs/PAYROLL_WORKFLOW.md): Sơ đồ quy trình chốt sổ và giải ngân lương.
- [`docs/BUSINESS_REPORTING.md`](docs/BUSINESS_REPORTING.md): Định nghĩa chỉ số kinh doanh, công thức lợi nhuận và lưu chuyển tiền tệ Phase 7.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md): Hướng dẫn chuẩn hóa phong cách thiết kế UI (Amber / Stone).
- [`docs/ROADMAP.md`](docs/ROADMAP.md): Lộ trình phát triển toàn diện của dự án.
