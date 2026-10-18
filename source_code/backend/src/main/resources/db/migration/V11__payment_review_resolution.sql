ALTER TABLE payment_transactions DROP CONSTRAINT payment_transactions_status_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_status_check
    CHECK (status IN ('PENDING','SUCCESS','FAILED','CANCELLED','EXPIRED','REVIEW_REQUIRED','REVIEW_CLOSED'));

WITH reopened AS (
    UPDATE payment_transactions
    SET status='REVIEW_REQUIRED', failure_reason='VNPAY: giao dịch cần đối soát', updated_at=now()
    WHERE status IN ('FAILED','CANCELLED') AND (transaction_status IN ('04','07') OR response_code='07')
    RETURNING order_id
)
UPDATE orders SET payment_status='PAYMENT_REVIEW', updated_at=now()
WHERE payment_status='UNPAID' AND id IN (SELECT order_id FROM reopened);
