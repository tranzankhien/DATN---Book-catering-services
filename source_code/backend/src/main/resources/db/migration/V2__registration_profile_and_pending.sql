ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);

CREATE TABLE pending_registrations (
    id UUID PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    address VARCHAR(500),
    customer_type VARCHAR(20),
    company_name VARCHAR(200),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE UNIQUE INDEX uq_pending_registrations_email ON pending_registrations (lower(email));
CREATE UNIQUE INDEX uq_pending_registrations_phone ON pending_registrations (phone);
