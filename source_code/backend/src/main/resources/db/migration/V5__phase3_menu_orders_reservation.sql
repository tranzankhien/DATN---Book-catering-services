-- =====================================================================
-- V5__phase3_menu_orders_reservation.sql
-- BanquetHub Phase 3 Schema:
--   - Thực đơn mẫu (menus, menu_items)
--   - Đơn đặt tiệc (orders, order_items, order_status_histories)
--   - Giữ nguyên liệu tạm thời 15 phút (stock_reservations, stock_reservation_items)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Bảng Thực đơn mẫu (Menus & Menu Items)
-- ---------------------------------------------------------------------
CREATE SEQUENCE menu_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE menus (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menus_status ON menus(status);
CREATE INDEX idx_menus_created_at ON menus(created_at DESC);

CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id),
    quantity_per_table INTEGER NOT NULL DEFAULT 1 CHECK (quantity_per_table > 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_menu_dish UNIQUE (menu_id, dish_id)
);

CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX idx_menu_items_dish_id ON menu_items(dish_id);

-- ---------------------------------------------------------------------
-- 2. Bảng Đơn đặt tiệc (Orders & Order Items)
--    Snapshot giá món và định lượng tại thời điểm đặt (Historical Immutability - BR-10)
-- ---------------------------------------------------------------------
CREATE SEQUENCE order_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id),
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(25) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    event_date_time TIMESTAMPTZ NOT NULL,
    table_count INTEGER NOT NULL CHECK (table_count > 0),
    note VARCHAR(1000),
    menu_id BIGINT REFERENCES menus(id),
    menu_name_snapshot VARCHAR(200),
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    order_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
        CHECK (order_status IN ('PENDING_PAYMENT', 'PAID', 'PREPARING', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED')),
    payment_expires_at TIMESTAMPTZ NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_event_date_time ON orders(event_date_time);
CREATE INDEX idx_orders_payment_expires ON orders(payment_expires_at);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id BIGINT NOT NULL REFERENCES dishes(id),
    dish_name_snapshot VARCHAR(180) NOT NULL,
    unit_price_snapshot NUMERIC(15, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity_per_table INTEGER NOT NULL CHECK (quantity_per_table > 0),
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_order_dish UNIQUE (order_id, dish_id)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_dish_id ON order_items(dish_id);

-- ---------------------------------------------------------------------
-- 3. Bảng Giữ nguyên liệu tạm thời (Stock Reservations & Items - BR-05, BR-06, BR-07)
--    Không trừ current_stock, không ghi StockMovement EXPORT khi chưa thanh toán
-- ---------------------------------------------------------------------
CREATE TABLE stock_reservations (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'RELEASED', 'FULFILLED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ
);

CREATE INDEX idx_stock_reservations_status_expires ON stock_reservations(status, expires_at);
CREATE INDEX idx_stock_reservations_order_id ON stock_reservations(order_id);

CREATE TABLE stock_reservation_items (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES stock_reservations(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
    reserved_quantity NUMERIC(12, 3) NOT NULL CHECK (reserved_quantity > 0),
    unit VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reservation_ingredient UNIQUE (reservation_id, ingredient_id)
);

CREATE INDEX idx_stock_res_items_res_id ON stock_reservation_items(reservation_id);
CREATE INDEX idx_stock_res_items_ing_id ON stock_reservation_items(ingredient_id);

-- ---------------------------------------------------------------------
-- 4. Bảng Lịch sử thay đổi trạng thái đơn hàng (Audit Log - BR-12)
-- ---------------------------------------------------------------------
CREATE TABLE order_status_histories (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by BIGINT REFERENCES users(id),
    changed_by_name VARCHAR(120) NOT NULL DEFAULT 'SYSTEM',
    reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_histories_order_id ON order_status_histories(order_id);
