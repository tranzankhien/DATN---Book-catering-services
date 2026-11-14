-- V17: Add updated_by audit column to payroll_adjustments
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS updated_by VARCHAR(120);
