CREATE TABLE orders (
    id UUID PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES users(id),
    hall_id UUID REFERENCES halls(id),
    service_location VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE NOT NULL,
    guest_count INTEGER NOT NULL,
    contact_name VARCHAR(120) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    event_address TEXT,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_orders_guest_count CHECK (guest_count > 0),
    CONSTRAINT ck_orders_location CHECK (service_location IN ('AT_RESTAURANT', 'OFFSITE'))
);
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    reference_id UUID NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    line_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_order_items_type CHECK (item_type IN ('DISH', 'SERVICE'))
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
