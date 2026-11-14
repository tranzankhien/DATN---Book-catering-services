# BANQUETHUB - QUY TRÌNH CHẤM CÔNG & TÍNH LƯƠNG (WORKFLOWS)

Tài liệu trực quan hóa luồng nghiệp vụ nhân sự, chấm công, tính toán lương và giải ngân chi trả trong hệ thống BanquetHub bằng biểu đồ Mermaid.

---

## 1. VÒNG ĐỜI KỲ TÍNH LƯƠNG (PAYROLL PERIOD LIFECYCLE)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Admin tạo kỳ lương (Tháng/Năm, Số công chuẩn)
    
    state DRAFT {
        [*] --> GhiNhanCong : Chấm công hàng ngày (PRESENT/HALF_DAY/ABSENT)
        GhiNhanCong --> DieuChinh : Thêm/sửa Phụ cấp & Khấu trừ
        DieuChinh --> DuToan : Xem trước bảng tính (Preview & Warnings)
    }

    DRAFT --> FINALIZED : Admin xác nhận Chốt sổ (Khóa chấm công & Tạo Snapshot bất biến)
    
    state FINALIZED {
        [*] --> ChoGiaiNgan : Bảng lương chuyển sang trạng thái UNPAID
        ChoGiaiNgan --> GiaiNganLuong : Kế toán chi trả (CASH / BANK_TRANSFER)
        GiaiNganLuong --> DaChiTra : Cập nhật trạng thái PAID & Tạo SalaryPayment record
    }

    FINALIZED --> CLOSED : Admin đóng kỳ lương sau khi hoàn tất chi trả
    
    state CLOSED {
        LuuTruVinhVien : Dữ liệu đóng băng vĩnh viễn, chỉ đọc (Read-only)
    }

    CLOSED --> [*]
```

---

## 2. LUỒNG CHẤM CÔNG HÀNG NGÀY & KIỂM TRA KHÓA DỮ LIỆU

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản Trị Viên (Admin)
    participant UI as Giao Diện Chấm Công
    participant Service as AttendanceService
    participant PeriodRepo as PayrollPeriodRepository
    participant DB as PostgreSQL (attendances)

    Admin->>UI: Chọn ngày làm việc & trạng thái công (P: 1.0, H: 0.5, A: 0.0)
    UI->>Service: PUT /api/v1/admin/attendance/{employeeId}/{date}
    Service->>PeriodRepo: findByYearAndMonth(year, month)
    
    alt Kỳ lương đã FINALIZED hoặc CLOSED
        PeriodRepo-->>Service: Period Status = FINALIZED / CLOSED
        Service-->>UI: 400 Bad Request ("Kỳ lương đã chốt sổ, dữ liệu bị khóa")
        UI-->>Admin: Hiển thị cảnh báo khóa dữ liệu màu vàng
    else Kỳ lương DRAFT hoặc Chưa tạo kỳ
        Service->>DB: INSERT / UPDATE attendances (UPSERT unique employee_id, work_date)
        DB-->>Service: Lưu thành công
        Service-->>UI: 200 OK (Dữ liệu công mới & WorkUnits)
        UI-->>Admin: Hiển thị ô màu xanh (P) / vàng (H) / đỏ (A)
    end
```

---

## 3. ĐỘNG CƠ TÍNH LƯƠNG & XEM TRƯỚC DỰ TOÁN (PREVIEW PIPELINE)

```mermaid
flowchart TD
    Start([Bắt đầu tính lương Tháng M/YYYY]) --> FetchEmps[Lấy danh sách nhân viên ACTIVE]
    FetchEmps --> LoopEmp[Duyệt từng nhân viên]
    
    LoopEmp --> CalcWorkdays["Tính tổng công thực tế:\nTổng work_units trong tháng"]
    CalcWorkdays --> CalcSalary["Tính lương theo công:\nRound(BaseSalary * Workdays / StandardDays, 0, HALF_UP)"]
    CalcSalary --> SumAllowances["Cộng tổng phụ cấp (ALLOWANCE)"]
    SumAllowances --> SumDeductions["Trừ tổng khấu trừ (DEDUCTION)"]
    SumDeductions --> CalcNet["Lương thực lĩnh =\nLương theo công + Phụ cấp - Khấu trừ"]
    
    CalcNet --> CheckWarn{"Kiểm tra cảnh báo:\n1. Công > Công chuẩn?\n2. Lương thực lĩnh < 0?"}
    CheckWarn -- Có cảnh báo --> AddWarn["Gắn nhãn cảnh báo (Warning flags)"]
    CheckWarn -- Không --> AddList["Đưa vào danh sách kết quả"]
    AddWarn --> AddList
    
    AddList --> NextEmp{Còn nhân viên?}
    NextEmp -- Có --> LoopEmp
    NextEmp -- Hết --> ReturnPreview["Trả về Preview DTO\nTổng quỹ lương, Cảnh báo & Chi tiết từng người"]
```

---

## 4. QUY TRÌNH CHỐT SỔ & TẠO SNAPSHOT BẤT BIẾN

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản Trị Viên
    participant PayrollService as PayrollService
    participant LockManager as Pessimistic Lock
    participant DB as PostgreSQL (payrolls & periods)

    Admin->>PayrollService: POST /api/v1/admin/payroll-periods/{id}/finalize
    PayrollService->>LockManager: Khóa dòng kỳ lương (Pessimistic Write Lock)
    PayrollService->>PayrollService: Tính toán lương thực lĩnh từng nhân sự
    
    alt Có nhân viên lương thực lĩnh âm (< 0)
        PayrollService-->>Admin: 400 Bad Request ("Không thể chốt sổ kỳ lương có lương âm")
    else Tất cả nhân viên hợp lệ
        PayrollService->>DB: INSERT INTO payrolls (Tạo bản chụp snapshot bất biến)
        PayrollService->>DB: UPDATE payroll_periods SET status = 'FINALIZED', finalized_at = NOW()
        DB-->>PayrollService: Commit Transaction
        PayrollService-->>Admin: 200 OK ("Chốt sổ kỳ lương thành công")
    end
```

---

## 5. QUY TRÌNH CHI TRẢ TIỀN LƯƠNG & CHỐNG CHI TRÙNG LẶP

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Kế Toán / Admin
    participant PayService as SalaryPaymentService
    participant PayrollRow as Payroll Row (Pessimistic Lock)
    participant PayRepo as SalaryPaymentRepository
    participant DB as PostgreSQL (salary_payments)

    Admin->>PayService: POST /api/v1/admin/payrolls/{id}/mark-paid (Method: CASH/BANK_TRANSFER)
    PayService->>PayrollRow: SELECT * FROM payrolls WHERE id = ? FOR UPDATE
    
    alt Kỳ lương chưa chốt (DRAFT)
        PayService-->>Admin: 400 Bad Request ("Kỳ lương chưa chốt sổ")
    else Bảng lương đã PAID hoặc đã tồn tại trong salary_payments
        PayService-->>Admin: 400 Bad Request ("Bảng lương đã được thanh toán trước đó")
    else Bảng lương UNPAID
        PayService->>DB: INSERT INTO salary_payments (amount = net_salary, method, date, recorded_by)
        PayService->>PayrollRow: UPDATE payrolls SET payment_status = 'PAID'
        DB-->>PayService: Commit Transaction (Bảo đảm an toàn giao dịch)
        PayService-->>Admin: 200 OK ("Ghi nhận thanh toán lương thành công")
    end
```

---

## 6. PHÂN QUYỀN TRUY CẬP TỰ PHỤC VỤ CỦA NHÂN VIÊN (SELF-SERVICE)

```mermaid
flowchart LR
    EmployeeUser[Nhân Viên Đăng Nhập] --> JWT[Mang JWT Token có Claim userId]
    JWT --> Gateway["Spring Security (/api/v1/employee/me/**)"]
    Gateway --> Identify["Trích xuất userId từ SecurityContext\n(Tuyệt đối không nhận employeeId từ URL)"]
    Identify --> FindEmp["Tìm kiếm trong bảng employees\nWHERE user_id = :userId"]
    
    FindEmp --> Found{Tìm thấy hồ sơ?}
    Found -- Không --> Err404["404 Not Found:\nTài khoản chưa được liên kết hồ sơ nhân sự"]
    Found -- Có --> ReturnData["Trả về dữ liệu cá nhân:\n1. Bảng chấm công của chính mình\n2. Phiếu lương chính thức của chính mình"]
```
