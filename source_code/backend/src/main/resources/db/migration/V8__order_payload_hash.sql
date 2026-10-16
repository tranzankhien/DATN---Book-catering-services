-- =====================================================================
-- Migration V8: Bổ sung dấu vân tay payload đặt tiệc (payload_hash)
-- Phục vụ kiểm tra toàn vẹn Idempotency chống xung đột (BR-13)
-- =====================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_custom_items BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN orders.payload_hash IS 'SHA-256 hash của toàn bộ nội dung yêu cầu đặt tiệc gốc';
COMMENT ON COLUMN orders.is_custom_items IS 'True nếu khách chọn món tùy biến, False nếu đặt theo thực đơn mẫu mặc định';
