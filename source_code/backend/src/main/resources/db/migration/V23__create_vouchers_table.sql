-- =====================================================================
-- V23__create_vouchers_table.sql
-- BanquetHub Voucher & Promotion Management Schema
-- =====================================================================

CREATE TABLE vouchers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('FIXED', 'PERCENTAGE')),
    discount_value NUMERIC(15, 2) NOT NULL CHECK (discount_value > 0),
    max_discount_amount NUMERIC(15, 2) NULL CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
    min_order_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    start_date TIMESTAMPTZ NULL,
    end_date TIMESTAMPTZ NULL,
    usage_limit INT NULL CHECK (usage_limit IS NULL OR usage_limit > 0),
    used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    limit_per_user INT NOT NULL DEFAULT 1 CHECK (limit_per_user > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_is_active ON vouchers(is_active);

CREATE TABLE voucher_usages (
    id BIGSERIAL PRIMARY KEY,
    voucher_id BIGINT NOT NULL REFERENCES vouchers(id) ON DELETE RESTRICT,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount NUMERIC(15, 2) NOT NULL CHECK (discount_amount >= 0),
    used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voucher_usages_voucher_id ON voucher_usages(voucher_id);
CREATE INDEX idx_voucher_usages_user_id ON voucher_usages(user_id);
CREATE INDEX idx_voucher_usages_order_id ON voucher_usages(order_id);

-- Add voucher columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(15, 2) NULL;

-- Backfill subtotal_amount for existing orders
UPDATE orders SET subtotal_amount = total_amount WHERE subtotal_amount IS NULL;

-- Seed initial promotional vouchers for testing & marketing
INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, start_date, end_date, usage_limit, used_count, limit_per_user, is_active)
VALUES 
('TIECXUAN2026', 'Ưu đãi Khởi sắc Tiệc Xuân 2026', 'Giảm trực tiếp 500.000 ₫ cho các đơn tiệc có tổng giá trị từ 5.000.000 ₫', 'FIXED', 500000, NULL, 5000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 200, 0, 1, TRUE),
('BANQUET10', 'Tri ân Khách hàng Thân thiết 10%', 'Giảm 10% tổng giá trị bàn tiệc, mức giảm tối đa 1.500.000 ₫ cho đơn từ 8.000.000 ₫', 'PERCENTAGE', 10, 1500000, 8000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 100, 0, 1, TRUE),
('VIPTIEC1TR', 'Voucher Đặc quyền Tiệc VIP 1 Triệu', 'Giảm 1.000.000 ₫ cho các đại tiệc có quy mô từ 15.000.000 ₫ trở lên', 'FIXED', 1000000, NULL, 15000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '180 days', 50, 0, 1, TRUE)
ON CONFLICT (code) DO NOTHING;
