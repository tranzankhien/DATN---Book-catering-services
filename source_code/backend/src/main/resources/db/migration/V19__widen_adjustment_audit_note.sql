-- V19: Widen note and add audit_detail in payroll_adjustment_audits
ALTER TABLE payroll_adjustment_audits ALTER COLUMN note TYPE TEXT;
ALTER TABLE payroll_adjustment_audits ADD COLUMN IF NOT EXISTS audit_detail TEXT;
