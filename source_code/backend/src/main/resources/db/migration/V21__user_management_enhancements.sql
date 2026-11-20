-- =====================================================================
-- V21__user_management_enhancements.sql
-- Thêm cột last_login_at để theo dõi lịch sử hoạt động và index tìm kiếm
-- =====================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
