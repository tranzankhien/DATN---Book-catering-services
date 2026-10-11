-- =====================================================================
-- V6__seed_phase3_menus.sql
-- BanquetHub Phase 3: Dữ liệu mẫu thực đơn tiệc chuẩn Việt Nam
-- =====================================================================

-- 1. Thực đơn mẫu 1: Hỷ Sự Hoàng Gia (Tiệc Cưới & Kỷ Niệm Thượng Hạng)
INSERT INTO menus (code, name, description, image_url, status)
VALUES (
    'MN-001',
    'Thực Đơn Hỷ Sự Hoàng Gia',
    'Thực đơn 7 món tinh hoa dành cho tiệc cưới sang trọng và lễ kỷ niệm đại hỷ. Kết hợp trọn vẹn hương vị khai vị thanh nhã, hải sản thượng hạng và lẩu ấm cúng.',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80',
    'ACTIVE'
) ON CONFLICT (code) DO NOTHING;

-- Món trong Thực đơn 1:
INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 1 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-001'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 2 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-002'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 3 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-003'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 4 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-004'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 5 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-007'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 6 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-009'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 7 FROM menus m, dishes d WHERE m.code = 'MN-001' AND d.code = 'DISH-010'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

-- 2. Thực đơn mẫu 2: Dạ Tiệc Doanh Nghiệp (Gala Dinner & Hội Nghị)
INSERT INTO menus (code, name, description, image_url, status)
VALUES (
    'MN-002',
    'Thực Đơn Dạ Tiệc Doanh Nghiệp',
    'Thực đơn 6 món đẳng cấp phù hợp tiệc tri ân khách hàng, tiệc tất niên và hội nghị công ty với các món nướng và bò đậm đà.',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    'ACTIVE'
) ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 1 FROM menus m, dishes d WHERE m.code = 'MN-002' AND d.code = 'DISH-002'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 2 FROM menus m, dishes d WHERE m.code = 'MN-002' AND d.code = 'DISH-005'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 3 FROM menus m, dishes d WHERE m.code = 'MN-002' AND d.code = 'DISH-006'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 4 FROM menus m, dishes d WHERE m.code = 'MN-002' AND d.code = 'DISH-008'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 5 FROM menus m, dishes d WHERE m.code = 'MN-002' AND d.code = 'DISH-009'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 6 FROM menus m, dishes d WHERE m.code = 'MN-002' AND d.code = 'DISH-010'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

-- 3. Thực đơn mẫu 3: Thuần Việt Sum Vầy (Tiệc Gia Đình & Thôi Nôi)
INSERT INTO menus (code, name, description, image_url, status)
VALUES (
    'MN-003',
    'Thực Đơn Thuần Việt Sum Vầy',
    'Thực đơn 5 món ấm cúng mang phong vị ẩm thực ba miền truyền thống, thích hợp tiệc họp mặt gia đình, sinh nhật và thôi nôi.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
    'ACTIVE'
) ON CONFLICT (code) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 1 FROM menus m, dishes d WHERE m.code = 'MN-003' AND d.code = 'DISH-001'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 2 FROM menus m, dishes d WHERE m.code = 'MN-003' AND d.code = 'DISH-006'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 3 FROM menus m, dishes d WHERE m.code = 'MN-003' AND d.code = 'DISH-004'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 4 FROM menus m, dishes d WHERE m.code = 'MN-003' AND d.code = 'DISH-008'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

INSERT INTO menu_items (menu_id, dish_id, quantity_per_table, display_order)
SELECT m.id, d.id, 1, 5 FROM menus m, dishes d WHERE m.code = 'MN-003' AND d.code = 'DISH-010'
ON CONFLICT (menu_id, dish_id) DO NOTHING;

-- Cập nhật sequence menu_code_seq sau dữ liệu seed
SELECT setval('menu_code_seq', 3);
