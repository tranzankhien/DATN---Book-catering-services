CREATE TABLE email_outbox (
 id BIGSERIAL PRIMARY KEY,
 order_id BIGINT NOT NULL REFERENCES orders(id),
 event_type VARCHAR(40) NOT NULL CHECK (event_type IN ('PAYMENT_CONFIRMED','ORDER_PREPARING','ORDER_COMPLETED')),
 recipient VARCHAR(254) NOT NULL,
 subject VARCHAR(255) NOT NULL,
 html_body TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SENT','FAILED')),
 attempts INTEGER NOT NULL DEFAULT 0,
 last_error VARCHAR(500),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 sent_at TIMESTAMPTZ,
 next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 lease_until TIMESTAMPTZ,
 claim_token VARCHAR(36),
 UNIQUE(order_id,event_type)
);
CREATE INDEX idx_email_outbox_due ON email_outbox(status,next_attempt_at);
