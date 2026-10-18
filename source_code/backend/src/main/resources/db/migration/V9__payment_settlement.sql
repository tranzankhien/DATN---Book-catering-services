ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('UNPAID','PARTIALLY_PAID','PAID','REFUNDED','PAYMENT_REVIEW'));

CREATE TABLE payment_transactions (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id),
 provider VARCHAR(20) NOT NULL DEFAULT 'VNPAY', transaction_reference VARCHAR(64) NOT NULL UNIQUE,
 provider_transaction_no VARCHAR(30), amount NUMERIC(15,2) NOT NULL CHECK(amount>0), currency VARCHAR(3) NOT NULL DEFAULT 'VND',
 status VARCHAR(30) NOT NULL CHECK(status IN ('PENDING','SUCCESS','FAILED','CANCELLED','EXPIRED','REVIEW_REQUIRED')),
 response_code VARCHAR(2), transaction_status VARCHAR(2), bank_code VARCHAR(20), pay_date VARCHAR(14),
 payment_url TEXT NOT NULL, failure_reason VARCHAR(500), created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
 paid_at TIMESTAMPTZ, expires_at TIMESTAMPTZ NOT NULL, last_queried_at TIMESTAMPTZ, query_count INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uq_payment_success_order ON payment_transactions(order_id) WHERE status='SUCCESS';
CREATE UNIQUE INDEX uq_payment_pending_order ON payment_transactions(order_id) WHERE status='PENDING';
CREATE UNIQUE INDEX uq_provider_transaction ON payment_transactions(provider,provider_transaction_no) WHERE provider_transaction_no IS NOT NULL AND provider_transaction_no <> '0';
CREATE INDEX idx_payments_status_created ON payment_transactions(status,created_at DESC);
CREATE INDEX idx_payments_order ON payment_transactions(order_id);

CREATE TABLE order_ingredient_consumptions (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id), ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
 quantity_used NUMERIC(12,3) NOT NULL CHECK(quantity_used>0), unit_cost_snapshot NUMERIC(18,4) NOT NULL CHECK(unit_cost_snapshot>=0),
 total_cost NUMERIC(24,4) NOT NULL CHECK(total_cost>=0), recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(order_id,ingredient_id)
);
CREATE TABLE payment_notification_logs (
 id BIGSERIAL PRIMARY KEY, transaction_reference VARCHAR(64), source VARCHAR(20) NOT NULL,
 result_code VARCHAR(20) NOT NULL, detail VARCHAR(500), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payment_notifications_ref ON payment_notification_logs(transaction_reference,created_at DESC);

ALTER TABLE stock_reservations DROP CONSTRAINT IF EXISTS stock_reservations_status_check;
ALTER TABLE stock_reservations ADD CONSTRAINT stock_reservations_status_check CHECK (status IN ('ACTIVE','RELEASED','FULFILLED','EXPIRED','CONSUMED'));
