-- =====================================================================
-- V16__phase6_hr_payroll.sql
-- BanquetHub Phase 6 Schema: Employees, Attendance, Payroll Periods,
-- Adjustments, Payrolls, and Salary Payments
-- =====================================================================

-- 1. Employees Table
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(25),
    email VARCHAR(150),
    position VARCHAR(80) NOT NULL,
    hire_date DATE NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_code ON employees(employee_code);

-- 2. Attendances Table
CREATE TABLE attendances (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    work_date DATE NOT NULL,
    attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('PRESENT', 'HALF_DAY', 'ABSENT')),
    work_units NUMERIC(3, 1) NOT NULL CHECK (work_units IN (0.0, 0.5, 1.0)),
    note TEXT,
    created_by VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, work_date)
);

CREATE INDEX idx_attendances_emp_date ON attendances(employee_id, work_date);
CREATE INDEX idx_attendances_work_date ON attendances(work_date);

-- 3. Payroll Periods Table
CREATE TABLE payroll_periods (
    id BIGSERIAL PRIMARY KEY,
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    standard_workdays NUMERIC(5, 2) NOT NULL DEFAULT 26.0 CHECK (standard_workdays > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINALIZED', 'CLOSED')),
    note TEXT,
    created_by VARCHAR(120),
    finalized_by VARCHAR(120),
    finalized_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payroll_period_year_month UNIQUE (year, month)
);

CREATE INDEX idx_payroll_periods_year_month ON payroll_periods(year, month);
CREATE INDEX idx_payroll_periods_status ON payroll_periods(status);

-- 4. Payroll Adjustments (Allowances & Deductions) Table
CREATE TABLE payroll_adjustments (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    payroll_period_id BIGINT NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('ALLOWANCE', 'DEDUCTION')),
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    created_by VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adjustments_period_emp ON payroll_adjustments(payroll_period_id, employee_id);

-- 5. Payrolls (Snapshot at finalization) Table
CREATE TABLE payrolls (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    payroll_period_id BIGINT NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    employee_code_snapshot VARCHAR(30) NOT NULL,
    employee_name_snapshot VARCHAR(120) NOT NULL,
    base_salary_snapshot NUMERIC(15, 2) NOT NULL CHECK (base_salary_snapshot >= 0),
    standard_workdays_snapshot NUMERIC(5, 2) NOT NULL CHECK (standard_workdays_snapshot > 0),
    actual_workdays_snapshot NUMERIC(5, 2) NOT NULL CHECK (actual_workdays_snapshot >= 0),
    calculated_salary NUMERIC(15, 2) NOT NULL CHECK (calculated_salary >= 0),
    total_allowances NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_allowances >= 0),
    total_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_deductions >= 0),
    net_salary NUMERIC(15, 2) NOT NULL CHECK (net_salary >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    finalized_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payroll_employee_period UNIQUE (employee_id, payroll_period_id)
);

CREATE INDEX idx_payrolls_period ON payrolls(payroll_period_id);
CREATE INDEX idx_payrolls_employee ON payrolls(employee_id);
CREATE INDEX idx_payrolls_payment_status ON payrolls(payment_status);

-- 6. Salary Payments Table
CREATE TABLE salary_payments (
    id BIGSERIAL PRIMARY KEY,
    payroll_id BIGINT NOT NULL UNIQUE REFERENCES payrolls(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER')),
    note TEXT,
    recorded_by VARCHAR(120),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_salary_payments_payroll ON salary_payments(payroll_id);

-- Seed an initial active employee linked to default employee user (employee@banquethub.vn)
INSERT INTO employees (employee_code, user_id, full_name, phone, email, position, hire_date, base_salary, status, note)
SELECT 'EMP-001', id, full_name, COALESCE(phone, '0912345678'), email, 'Bếp trưởng & Điều phối tiệc', '2025-01-15', 9000000.00, 'ACTIVE', 'Nhân viên mẫu hệ thống BanquetHub'
FROM users WHERE email = 'employee@banquethub.vn'
ON CONFLICT (employee_code) DO NOTHING;
