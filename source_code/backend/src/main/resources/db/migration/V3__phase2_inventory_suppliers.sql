-- =====================================================================
-- V3__phase2_inventory_suppliers.sql
-- BanquetHub Phase 2: Nhà cung cấp, Phiếu nhập, Biến động kho, Điều chỉnh tồn
-- Mở rộng bảng ingredients của Phase 1 (KHÔNG tạo bảng nguyên liệu trùng chức năng)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Mở rộng bảng ingredients
--    - version: optimistic locking chống ghi đè đồng thời
--    - avg_unit_cost: tăng độ chính xác lên 4 chữ số thập phân để giá vốn
--      bình quân gia quyền liên hoàn không bị trôi số qua nhiều lần nhập
-- ---------------------------------------------------------------------
ALTER TABLE ingredients ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ingredients ALTER COLUMN avg_unit_cost TYPE NUMERIC(18, 4);

CREATE INDEX idx_ingredients_name_lower ON ingredients (LOWER(name));

-- Sequence sinh mã nguyên liệu tự động (NL-000013 ...), bắt đầu sau dữ liệu mẫu
CREATE SEQUENCE ingredient_code_seq START WITH 1 INCREMENT BY 1;
SELECT setval('ingredient_code_seq', GREATEST((SELECT COUNT(*) FROM ingredients), 1));

-- ---------------------------------------------------------------------
-- 2. Nhà cung cấp
-- ---------------------------------------------------------------------
CREATE SEQUENCE supplier_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(150),
    address VARCHAR(300),
    note VARCHAR(1000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_name_lower ON suppliers (LOWER(name));
CREATE INDEX idx_suppliers_phone ON suppliers (phone);
CREATE INDEX idx_suppliers_active ON suppliers (active);

-- ---------------------------------------------------------------------
-- 3. Phiếu nhập nguyên liệu (đầu phiếu)
--    total_amount do hệ thống tự tính = SUM(line_total)
--    amount_paid <= total_amount (không trả vượt tổng phiếu trong MVP)
-- ---------------------------------------------------------------------
CREATE SEQUENCE stock_receipt_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE stock_receipts (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    receipt_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED')),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    last_paid_at TIMESTAMPTZ,
    payment_note VARCHAR(500),
    note VARCHAR(1000),
    created_by BIGINT REFERENCES users(id),
    created_by_name VARCHAR(120),
    confirmed_at TIMESTAMPTZ,
    confirmed_by BIGINT REFERENCES users(id),
    confirmed_by_name VARCHAR(120),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_receipt_paid_not_exceed_total CHECK (amount_paid <= total_amount),
    CONSTRAINT chk_receipt_confirmed_fields CHECK (
        (status = 'DRAFT' AND confirmed_at IS NULL) OR (status = 'CONFIRMED' AND confirmed_at IS NOT NULL)
    )
);

CREATE INDEX idx_stock_receipts_supplier_id ON stock_receipts (supplier_id);
CREATE INDEX idx_stock_receipts_status ON stock_receipts (status);
CREATE INDEX idx_stock_receipts_receipt_date ON stock_receipts (receipt_date);

-- ---------------------------------------------------------------------
-- 4. Dòng phiếu nhập
--    unit: bản sao đơn vị gốc của nguyên liệu tại thời điểm lập phiếu
-- ---------------------------------------------------------------------
CREATE TABLE stock_receipt_items (
    id BIGSERIAL PRIMARY KEY,
    receipt_id BIGINT NOT NULL REFERENCES stock_receipts(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
    line_no INTEGER NOT NULL CHECK (line_no > 0),
    unit VARCHAR(30) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_receipt_item_ingredient UNIQUE (receipt_id, ingredient_id)
);

CREATE INDEX idx_stock_receipt_items_receipt_id ON stock_receipt_items (receipt_id);
CREATE INDEX idx_stock_receipt_items_ingredient_id ON stock_receipt_items (ingredient_id);

-- ---------------------------------------------------------------------
-- 5. Phiếu điều chỉnh tồn kho (chứng từ có lý do, FR-INV-05)
-- ---------------------------------------------------------------------
CREATE SEQUENCE stock_adjustment_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE stock_adjustments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
    quantity_change NUMERIC(12, 3) NOT NULL CHECK (quantity_change <> 0),
    reason VARCHAR(500) NOT NULL CHECK (LENGTH(TRIM(reason)) > 0),
    created_by BIGINT REFERENCES users(id),
    created_by_name VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_adjustments_ingredient_id ON stock_adjustments (ingredient_id);

-- ---------------------------------------------------------------------
-- 6. Sổ biến động kho (Stock Ledger) – bất biến, chỉ INSERT
--    quantity_change có dấu: + nhập/điều chỉnh tăng, - xuất/điều chỉnh giảm
--    unit_cost: đơn giá áp dụng cho biến động (giá nhập với IMPORT,
--    giá vốn bình quân tại thời điểm xuất với EXPORT – snapshot cho Phase 4)
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IMPORT', 'EXPORT', 'ADJUSTMENT')),
    quantity_change NUMERIC(12, 3) NOT NULL CHECK (quantity_change <> 0),
    stock_before NUMERIC(12, 3) NOT NULL CHECK (stock_before >= 0),
    stock_after NUMERIC(12, 3) NOT NULL CHECK (stock_after >= 0),
    unit_cost NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    avg_cost_before NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (avg_cost_before >= 0),
    avg_cost_after NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (avg_cost_after >= 0),
    reference_type VARCHAR(30) NOT NULL
        CHECK (reference_type IN ('OPENING_BALANCE', 'STOCK_RECEIPT', 'STOCK_ADJUSTMENT', 'ORDER')),
    reference_id BIGINT,
    reference_code VARCHAR(50),
    note VARCHAR(500),
    performed_by BIGINT REFERENCES users(id),
    performed_by_name VARCHAR(120) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_movement_balance CHECK (stock_after = stock_before + quantity_change),
    CONSTRAINT chk_movement_direction CHECK (
        (movement_type = 'IMPORT' AND quantity_change > 0)
        OR (movement_type = 'EXPORT' AND quantity_change < 0)
        OR (movement_type = 'ADJUSTMENT')
    )
);

CREATE INDEX idx_stock_movements_ingredient_created ON stock_movements (ingredient_id, created_at DESC);
CREATE INDEX idx_stock_movements_type ON stock_movements (movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements (created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements (reference_type, reference_id);

-- Bảo vệ tầng CSDL: mỗi dòng phiếu nhập chỉ được cộng kho đúng MỘT lần,
-- mỗi đơn hàng chỉ trừ kho MỘT lần cho mỗi nguyên liệu (dùng lại ở Phase 4)
CREATE UNIQUE INDEX uq_stock_movement_receipt_import
    ON stock_movements (reference_id, ingredient_id)
    WHERE reference_type = 'STOCK_RECEIPT' AND movement_type = 'IMPORT';

CREATE UNIQUE INDEX uq_stock_movement_order_export
    ON stock_movements (reference_id, ingredient_id)
    WHERE reference_type = 'ORDER' AND movement_type = 'EXPORT';

-- ---------------------------------------------------------------------
-- 7. Số dư đầu kỳ: hợp thức hóa tồn kho dữ liệu mẫu Phase 1 bằng chứng từ
--    để tổng biến động luôn khớp với current_stock
-- ---------------------------------------------------------------------
INSERT INTO stock_movements (
    ingredient_id, movement_type, quantity_change, stock_before, stock_after,
    unit_cost, avg_cost_before, avg_cost_after,
    reference_type, reference_code, note, performed_by_name
)
SELECT
    i.id, 'ADJUSTMENT', i.current_stock, 0, i.current_stock,
    i.avg_unit_cost, i.avg_unit_cost, i.avg_unit_cost,
    'OPENING_BALANCE', 'TON-DAU-KY', 'Số dư tồn đầu kỳ khởi tạo từ dữ liệu Phase 1', 'SYSTEM'
FROM ingredients i
WHERE i.current_stock > 0;

