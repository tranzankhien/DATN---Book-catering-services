ALTER TABLE payment_transactions ALTER COLUMN provider SET DEFAULT 'SEPAY';
ALTER TABLE payment_transactions ALTER COLUMN provider_transaction_no TYPE VARCHAR(100);

-- Preserve financial history while retiring open sessions from the previous gateway.
UPDATE payment_transactions
SET status = 'EXPIRED', updated_at = now()
WHERE provider = 'VNPAY' AND status = 'PENDING';
