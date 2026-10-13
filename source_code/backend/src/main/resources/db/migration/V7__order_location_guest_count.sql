-- =====================================================================
-- Migration V7: Bổ sung thông tin địa điểm và số lượng khách vào bảng đơn tiệc (orders)
-- BanquetHub Phase 3 Refinement (SRS-PARTY-001)
-- =====================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_location VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_count INTEGER;

COMMENT ON COLUMN orders.event_location IS 'Địa điểm tổ chức tiệc (sảnh tiệc, nhà riêng, địa chỉ cụ thể)';
COMMENT ON COLUMN orders.guest_count IS 'Số lượng khách mời dự kiến tham dự';
