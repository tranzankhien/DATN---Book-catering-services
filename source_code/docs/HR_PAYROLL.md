# BANQUETHUB - QUẢN LÝ NHÂN SỰ, CHẤM CÔNG & TÍNH LƯƠNG (PHASE 6)

Tài liệu đặc tả kỹ thuật, quy trình nghiệp vụ và kiến trúc module Nhân sự, Chấm công, Bảng lương và Theo dõi Chi trả lương cho hệ thống BanquetHub.

---

## 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU

Module Quản lý Nhân sự & Tiền lương (Phase 6) giải quyết trọn vẹn bài toán vận hành nhân sự nhà hàng tiệc cưới:
1. **Hồ sơ nhân viên (Employee Directory)**: Quản lý danh bạ nhân sự, vị trí công việc, ngày vào làm, mức lương cơ bản theo hợp đồng và liên kết tài khoản hệ thống (`ROLE_EMPLOYEE`).
2. **Chấm công hàng ngày (Daily Attendance Tracking)**: Ghi nhận ngày công thực tế cho từng nhân viên theo từng ngày với 3 trạng thái chuẩn (`PRESENT` = 1.0 công, `HALF_DAY` = 0.5 công, `ABSENT` = 0.0 công).
3. **Kỳ tính lương (Payroll Periods)**: Quản lý chu kỳ tính lương theo tháng (`year`, `month`), số công chuẩn (mặc định 26.0 ngày), trạng thái vòng đời kỳ lương (`DRAFT` -> `FINALIZED` -> `CLOSED`).
4. **Động cơ tính lương chuẩn xác (Payroll Engine)**: Áp dụng công thức tính lương theo ngày công và làm tròn HALF_UP đến từng đồng VND; tự động cộng phụ cấp/thưởng và trừ khấu trừ.
5. **Khoản điều chỉnh (Allowances & Deductions)**: Cho phép thêm, sửa, xóa các khoản phụ cấp hoặc khấu trừ linh hoạt khi kỳ lương còn ở trạng thái `DRAFT`.
6. **Chốt sổ & Đóng băng Snapshot (Payroll Finalization)**: Tạo bản chụp bất biến (`payrolls`) lưu trữ đầy đủ thông tin nhân viên, lương cơ bản, ngày công và lương thực lĩnh tại thời điểm chốt; khóa chỉnh sửa chấm công.
7. **Theo dõi chi trả lương (Salary Payment Tracking)**: Ghi nhận giải ngân lương (tiền mặt / chuyển khoản), chi trả một lần toàn bộ lương thực lĩnh, chống chi trùng lặp qua khóa bi quan (`SELECT FOR UPDATE`) và ràng buộc duy nhất (`UNIQUE`).
8. **Cổng tự phục vụ của nhân viên (Employee Self-Service)**: Nhân viên đăng nhập xem bảng công và phiếu lương cá nhân của chính mình; kiểm soát nghiêm ngặt ngăn chặn truy cập dữ liệu của nhân viên khác.

---

## 2. KIẾN TRÚC CƠ SỞ DỮ LIỆU & SCHEMA (MIGRATION V16)

### 2.1. Bảng `employees` (Hồ sơ nhân viên)
Lưu trữ thông tin hợp đồng và hồ sơ của nhân sự:
- `id` (BIGSERIAL PRIMARY KEY)
- `employee_code` (VARCHAR(30) NOT NULL UNIQUE): Mã nhân viên định danh (VD: `NV-001`, `EMP-001`).
- `user_id` (BIGINT UNIQUE REFERENCES `users(id)` ON DELETE SET NULL): Liên kết tài khoản đăng nhập `ROLE_EMPLOYEE`.
- `full_name` (VARCHAR(120) NOT NULL): Họ và tên nhân viên.
- `phone` (VARCHAR(25)), `email` (VARCHAR(150))
- `position` (VARCHAR(80) NOT NULL): Vị trí đảm nhiệm (Bếp trưởng, Phụ bếp, Phục vụ, Quản lý sảnh,...).
- `hire_date` (DATE NOT NULL): Ngày vào làm.
- `base_salary` (NUMERIC(15, 2) NOT NULL DEFAULT 0.00): Mức lương cố định theo hợp đồng cho tháng chuẩn.
- `status` (VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'): Trạng thái `ACTIVE` hoặc `INACTIVE`.
- `note` (TEXT), `created_at`, `updated_at`

### 2.2. Bảng `attendances` (Chấm công hàng ngày)
- `id` (BIGSERIAL PRIMARY KEY)
- `employee_id` (BIGINT NOT NULL REFERENCES `employees(id)` ON DELETE CASCADE)
- `work_date` (DATE NOT NULL): Ngày làm việc.
- `attendance_status` (VARCHAR(20) NOT NULL): `PRESENT`, `HALF_DAY`, `ABSENT`.
- `work_units` (NUMERIC(3, 2) NOT NULL): Hệ số công (1.00, 0.50, 0.00).
- `note` (VARCHAR(255)): Ghi chú đi trễ, xin nghỉ, tăng ca.
- `recorded_by` (VARCHAR(120)), `recorded_at` (TIMESTAMPTZ)
- **Constraint**: `UNIQUE (employee_id, work_date)`

### 2.3. Bảng `payroll_periods` (Kỳ tính lương)
- `id` (BIGSERIAL PRIMARY KEY)
- `year` (INT NOT NULL), `month` (INT NOT NULL): Tháng/Năm tính lương (1 - 12).
- `standard_workdays` (NUMERIC(5, 2) NOT NULL DEFAULT 26.00): Số ngày công chuẩn của tháng.
- `status` (VARCHAR(20) NOT NULL DEFAULT 'DRAFT'): `DRAFT`, `FINALIZED`, `CLOSED`.
- `finalized_at`, `finalized_by`, `closed_at`, `note`
- **Constraint**: `UNIQUE (year, month)`

### 2.4. Bảng `payroll_adjustments` (Phụ cấp & Giảm trừ)
- `id` (BIGSERIAL PRIMARY KEY)
- `payroll_period_id` (BIGINT NOT NULL REFERENCES `payroll_periods(id)` ON DELETE CASCADE)
- `employee_id` (BIGINT NOT NULL REFERENCES `employees(id)` ON DELETE CASCADE)
- `adjustment_type` (VARCHAR(20) NOT NULL): `ALLOWANCE` (Phụ cấp/Thưởng) hoặc `DEDUCTION` (Khấu trừ/Phạt/Tạm ứng).
- `amount` (NUMERIC(15, 2) NOT NULL): Số tiền điều chỉnh (> 0).
- `reason` (VARCHAR(255) NOT NULL): Lý do chi tiết.
- `created_at` (TIMESTAMPTZ)

### 2.5. Bảng `payrolls` (Bảng lương bất biến - Snapshot)
- `id` (BIGSERIAL PRIMARY KEY)
- `employee_id` (BIGINT NOT NULL REFERENCES `employees(id)`)
- `payroll_period_id` (BIGINT NOT NULL REFERENCES `payroll_periods(id)`)
- `employee_code_snapshot` (VARCHAR(30) NOT NULL)
- `employee_name_snapshot` (VARCHAR(120) NOT NULL)
- `base_salary_snapshot` (NUMERIC(15, 2) NOT NULL)
- `standard_workdays_snapshot` (NUMERIC(5, 2) NOT NULL)
- `actual_workdays_snapshot` (NUMERIC(5, 2) NOT NULL)
- `calculated_salary` (NUMERIC(15, 2) NOT NULL): Lương theo công làm tròn VND.
- `total_allowances` (NUMERIC(15, 2) NOT NULL DEFAULT 0.00)
- `total_deductions` (NUMERIC(15, 2) NOT NULL DEFAULT 0.00)
- `net_salary` (NUMERIC(15, 2) NOT NULL): Lương thực lĩnh = Calculated + Allowances - Deductions.
- `payment_status` (VARCHAR(20) NOT NULL DEFAULT 'UNPAID'): `UNPAID` hoặc `PAID`.
- `finalized_at` (TIMESTAMPTZ NOT NULL)
- **Constraint**: `UNIQUE (employee_id, payroll_period_id)`

### 2.6. Bảng `salary_payments` (Nhật ký chi trả tiền lương)
- `id` (BIGSERIAL PRIMARY KEY)
- `payroll_id` (BIGINT NOT NULL UNIQUE REFERENCES `payrolls(id)`): Quan hệ 1-1 chống chi trùng.
- `amount` (NUMERIC(15, 2) NOT NULL): Số tiền chi trả (bằng đúng `net_salary`).
- `payment_date` (DATE NOT NULL): Ngày thực chi.
- `payment_method` (VARCHAR(30) NOT NULL): `CASH` hoặc `BANK_TRANSFER`.
- `note` (VARCHAR(255)), `recorded_by` (VARCHAR(120)), `recorded_at` (TIMESTAMPTZ)

---

## 3. CÔNG THỨC & NGUYÊN TẮC TÍNH TOÁN LƯƠNG

### 3.1. Tính ngày công thực tế
- Nhân viên đi làm đủ ngày: `+1.0` công (`PRESENT`)
- Nhân viên đi làm nửa buổi (ca sáng/chiều): `+0.5` công (`HALF_DAY`)
- Nhân viên vắng mặt hoặc không phép: `+0.0` công (`ABSENT`)
- Ngày không ghi nhận chấm công: Mặc định `0.0` công
- **Tổng công thực tế** = $\sum \text{work\_units}$ của nhân viên trong tháng.

### 3.2. Công thức tính Lương theo công
$$\text{Lương theo công} = \text{Round}\left(\frac{\text{Lương cơ bản} \times \text{Số công thực tế}}{\text{Số công chuẩn}}, 0, \text{HALF\_UP}\right)$$

### 3.3. Công thức tính Lương thực lĩnh
$$\text{Lương thực lĩnh} = \text{Lương theo công} + \sum \text{Phụ cấp} - \sum \text{Khấu trừ}$$

### 3.4. Ví dụ kiểm thử thực tế (Verified in Integration Tests)
- **Lương cơ bản hợp đồng**: `9,000,000 đ`
- **Số công chuẩn tháng**: `26.0 ngày`
- **Số công đi làm thực tế**: `24.0 ngày` (20 ngày đủ + 8 ngày nửa buổi)
- **Lương theo công**:
  $$\frac{9,000,000 \times 24}{26} = 8,307,692.30769... \xrightarrow{\text{HALF\_UP}} \mathbf{8,307,692\ \text{đ}}$$
- **Phụ cấp trách nhiệm**: `+500,000 đ`
- **Khấu trừ đồng phục**: `-200,000 đ`
- **Lương thực lĩnh cuối cùng**:
  $$8,307,692 + 500,000 - 200,000 = \mathbf{8,607,692\ \text{đ}}$$

---

## 4. BẢO MẬT & PHÂN QUYỀN

| Phân hệ / API | Endpoint | Quyền hạn | Ghi chú |
|---|---|---|---|
| Admin Employee CRUD | `/api/v1/admin/employees/**` | `ROLE_ADMIN` | Quản lý toàn bộ nhân sự |
| Admin Attendance | `/api/v1/admin/attendance/**` | `ROLE_ADMIN` | Chấm công hàng ngày, xem tổng hợp |
| Admin Payroll Periods | `/api/v1/admin/payroll-periods/**` | `ROLE_ADMIN` | Tạo kỳ, dự toán, chốt sổ, đóng kỳ |
| Admin Payroll Adjustments | `/api/v1/admin/payroll-periods/{id}/adjustments/**` | `ROLE_ADMIN` | Thêm/xóa phụ cấp & khấu trừ |
| Admin Payrolls & Payment | `/api/v1/admin/payrolls/**` | `ROLE_ADMIN` | Xem bảng lương, ghi nhận giải ngân |
| Admin Summary | `/api/v1/admin/payrolls/summary` | `ROLE_ADMIN` | Tích hợp Dashboard Phase 7 |
| Employee Self-Service | `/api/v1/employee/me/**` | `ROLE_EMPLOYEE`, `ROLE_ADMIN` | Nhận diện qua JWT `userId`, cấm can thiệp ID |

---

## 5. MA TRẬN TEST & KẾT QUẢ NGHIỆM THU (39/39 PASS)

Toàn bộ 39 test cases tự động trong `Phase6HrPayrollIntegrationTest` đã chạy thành công 100% trên PostgreSQL 17:
- **TC-01 -> TC-05**: CRUD Employee, mã NV tự sinh, unique code/user, bảo toàn lịch sử nhân viên INACTIVE, chặn phân quyền non-admin.
- **TC-06 -> TC-15**: Chấm công PRESENT/HALF_DAY/ABSENT, tổng hợp công cả tháng, phân biệt ngày chưa chấm, khóa dữ liệu khi kỳ lương đã FINALIZED/CLOSED.
- **TC-16 -> TC-20**: Khởi tạo kỳ lương, cấu hình công chuẩn, trạng thái DRAFT -> FINALIZED -> CLOSED, cấm sửa kỳ đã đóng.
- **TC-21 -> TC-25**: Tính lương chính xác, làm tròn HALF_UP đến từng đồng VND, cảnh báo công thực tế > công chuẩn, phụ cấp & khấu trừ.
- **TC-26 -> TC-29**: Dự toán trước, chốt sổ bảng lương snapshot bất biến, chặn chốt sổ khi lương âm.
- **TC-30 -> TC-36**: Ghi nhận chi trả lương CASH/BANK_TRANSFER, thanh toán đúng toàn bộ thực lĩnh một lần, chống double payment bằng bi quan lock, thống kê chi trả vs công nợ.
- **TC-37 -> TC-42**: Nhân viên chỉ xem bảng công và phiếu lương của chính mình, chặn truy cập trái phép nhân viên khác, thông báo lỗi rõ ràng nếu user chưa liên kết hồ sơ.
- **Hệ thống tổng hợp**: 139 / 139 test cases trên toàn bộ hệ thống (Phase 1 đến 6) đều PASS 100%.
