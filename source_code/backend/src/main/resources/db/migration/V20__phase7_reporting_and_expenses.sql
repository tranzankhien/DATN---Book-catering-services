-- =====================================================================
-- Phase 7: Business Dashboard, Revenue Analytics, Inventory Cost,
--          Expense Management & Profit Reporting
-- =====================================================================

-- 1. Bổ sung cột paid_at cho bảng orders để truy vấn doanh thu theo ngày thanh toán tối ưu
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Cập nhật paid_at cho các đơn hàng cũ đã thanh toán thành công
UPDATE orders o
SET paid_at = (
    SELECT pt.paid_at 
    FROM payment_transactions pt
    WHERE pt.order_id = o.id AND pt.status = 'SUCCESS' AND pt.paid_at IS NOT NULL
    ORDER BY pt.paid_at DESC 
    LIMIT 1
)
WHERE o.payment_status = 'PAID' AND o.paid_at IS NULL;

-- Fallback cho đơn đã PAID mà chưa có bản ghi payment_transaction paid_at
UPDATE orders 
SET paid_at = updated_at 
WHERE payment_status = 'PAID' AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);

-- 2. Bảng quản lý chi phí vận hành khác (Operating Expenses)
CREATE SEQUENCE IF NOT EXISTS operating_expense_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS operating_expenses (
    id BIGSERIAL PRIMARY KEY,
    expense_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('RENT', 'UTILITIES', 'MARKETING', 'CLEANING', 'OTHER')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    incurred_date DATE NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    paid_at TIMESTAMPTZ,
    note VARCHAR(1000),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operating_expenses_incurred_date ON operating_expenses(incurred_date);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_paid_at ON operating_expenses(paid_at);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_category ON operating_expenses(category);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_status ON operating_expenses(payment_status);

-- 3. Bảng ghi nhận lịch sử thanh toán nhà cung cấp (Supplier Payments)
CREATE TABLE IF NOT EXISTS supplier_payments (
    id BIGSERIAL PRIMARY KEY,
    stock_receipt_id BIGINT NOT NULL REFERENCES stock_receipts(id),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER' CHECK (payment_method IN ('CASH', 'BANK_TRANSFER')),
    note VARCHAR(500),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_receipt ON supplier_payments(stock_receipt_id);

-- 4. Bổ sung Index hỗ trợ tổng hợp báo cáo tài chính
CREATE INDEX IF NOT EXISTS idx_order_consumptions_order_id ON order_ingredient_consumptions(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipts_confirmed_at ON stock_receipts(confirmed_at) WHERE status = 'CONFIRMED';
CREATE INDEX IF NOT EXISTS idx_stock_receipts_last_paid_at ON stock_receipts(last_paid_at) WHERE payment_status = 'PAID';
