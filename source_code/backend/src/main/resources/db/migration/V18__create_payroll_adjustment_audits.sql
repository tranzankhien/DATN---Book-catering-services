-- V18: Create payroll adjustment audits table for full audit trail
CREATE TABLE IF NOT EXISTS payroll_adjustment_audits (
    id BIGSERIAL PRIMARY KEY,
    adjustment_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    payroll_period_id BIGINT NOT NULL,
    action VARCHAR(30) NOT NULL,
    adjustment_type VARCHAR(30) NOT NULL,
    old_amount NUMERIC(15, 2),
    new_amount NUMERIC(15, 2),
    old_name VARCHAR(150),
    new_name VARCHAR(150),
    note VARCHAR(255),
    actor_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adjustment_audits_adj_id ON payroll_adjustment_audits(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_audits_emp_period ON payroll_adjustment_audits(employee_id, payroll_period_id);
