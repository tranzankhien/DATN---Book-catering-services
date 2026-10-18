-- Existing Admin audit entries retain the original review notes.
UPDATE payment_transactions
SET failure_reason = 'Đã đóng đối soát thanh toán.'
WHERE failure_reason LIKE 'Đã xử lý thủ công: %';

UPDATE order_status_histories
SET reason = CASE
    WHEN reason LIKE 'Đóng đối soát: %' THEN 'Đã đóng đối soát thanh toán.'
    ELSE 'Đã xác nhận thanh toán sau đối soát.'
END
WHERE reason LIKE 'Đóng đối soát: %' OR reason LIKE 'Xử lý lại đối soát: %';

UPDATE email_outbox
SET html_body = regexp_replace(html_body, '(href="https?://[^"]*)/orders/([0-9]+")', '\1/my-orders/\2', 'g')
WHERE status IN ('PENDING','FAILED','PROCESSING')
  AND html_body ~ 'href="https?://[^"]*/orders/[0-9]+"';

UPDATE payment_transactions
SET status = 'EXPIRED', updated_at = now()
WHERE status = 'PENDING' AND (expires_at <= now() OR EXISTS (
    SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.order_status = 'EXPIRED'
));
