-- =====================================================================
-- V4__seed_phase2_suppliers.sql
-- Danh bạ nhà cung cấp mẫu cho môi trường phát triển (không phát sinh tồn kho)
-- =====================================================================

INSERT INTO suppliers (code, name, phone, email, address, note, active)
VALUES
    ('NCC-0001', 'Công ty TNHH Hải Sản Tươi Sống Vũng Tàu', '0903112233', 'kinhdoanh@haisanvungtau.vn',
     '125 Trần Phú, Phường 5, TP. Vũng Tàu', 'Chuyên tôm sú, mực ống, cá chẽm. Giao hàng trước 6h sáng.', TRUE),
    ('NCC-0002', 'Nông Trại Rau Sạch Đà Lạt Xanh', '0918223344', NULL,
     'Thôn Đa Thọ, Xã Xuân Thọ, TP. Đà Lạt', 'Rau củ, nấm và ngó sen theo mùa.', TRUE),
    ('NCC-0003', 'Cửa Hàng Thực Phẩm Thịt Sạch Phú Nhuận', '0287778899', 'dathang@thitsachpn.vn',
     '48 Phan Đăng Lưu, Quận Phú Nhuận, TP. Hồ Chí Minh', 'Thịt bò Úc, sườn heo, gà ta thả vườn.', TRUE)
ON CONFLICT (code) DO NOTHING;

SELECT setval('supplier_code_seq', 3);

