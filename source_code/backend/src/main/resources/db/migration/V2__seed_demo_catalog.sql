-- =====================================================================
-- V2__seed_demo_catalog.sql
-- Dữ liệu mẫu nhà hàng tiệc Việt Nam (BanquetHub MVP)
-- Gồm: 5 danh mục món, 12 nguyên liệu, 10 món ăn và công thức định lượng
-- =====================================================================

-- 1. Danh mục món ăn (5 danh mục)
INSERT INTO dish_categories (code, name, description, display_order, active)
VALUES
    ('KHAI_VI', 'Món Khai Vị & Gỏi', 'Các món gỏi truyền thống, súp và khai vị mở đầu bàn tiệc', 1, TRUE),
    ('HAI_SAN', 'Hải Sản Cao Cấp', 'Các món tôm, cá, mực tươi sống chế biến theo phong cách tiệc cưới & hội nghị', 2, TRUE),
    ('THIT_GIA_CAM', 'Thịt & Gia Cầm Đặc Sắc', 'Các món bò, gà ta, sườn heo nướng và hầm tiêu xanh truyền thống', 3, TRUE),
    ('LAU_CANH', 'Món Lẩu & Canh Tiềm', 'Lẩu hải sản, lẩu thái và canh tiềm bổ dưỡng dùng cuối bữa tiệc', 4, TRUE),
    ('TRANG_MIENG', 'Tráng Miệng', 'Chè hạt sen, trái cây nhiệt đới theo mùa thanh mát', 5, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Nguyên liệu kho (12 nguyên liệu chuẩn đơn vị gốc)
INSERT INTO ingredients (code, name, unit, min_stock_threshold, current_stock, avg_unit_cost, active)
VALUES
    ('ING-TOM-SU', 'Tôm sú tươi loại 1 (20 con/kg)', 'kg', 10.000, 45.000, 320000.00, TRUE),
    ('ING-BO-MY', 'Thịt thăn bò Úc / Mỹ tươi', 'kg', 8.000, 35.000, 340000.00, TRUE),
    ('ING-GA-TA', 'Gà ta thả vườn làm sạch', 'kg', 12.000, 50.000, 145000.00, TRUE),
    ('ING-CA-CHEM', 'Cá chẽm tươi nguyên con', 'kg', 10.000, 40.000, 180000.00, TRUE),
    ('ING-MUC-ONG', 'Mực ống tươi câu', 'kg', 8.000, 30.000, 260000.00, TRUE),
    ('ING-SUON-HEO', 'Sườn non heo tươi', 'kg', 10.000, 42.000, 175000.00, TRUE),
    ('ING-NAM-DONG-CO', 'Nấm đông cô & nấm kim châm tươi', 'kg', 5.000, 25.000, 120000.00, TRUE),
    ('ING-NGO-SEN', 'Ngó sen tươi sơ chế', 'kg', 5.000, 22.000, 75000.00, TRUE),
    ('ING-HAT-SEN', 'Hạt sen tươi Huế', 'kg', 5.000, 20.000, 160000.00, TRUE),
    ('ING-RAU-CU-LAU', 'Rau củ tổng hợp & gia vị lẩu', 'kg', 10.000, 50.000, 55000.00, TRUE),
    ('ING-BUN-TUOI', 'Bún tươi & mì trứng ăn kèm', 'kg', 8.000, 35.000, 25000.00, TRUE),
    ('ING-TRAI-CAY', 'Trái cây nhiệt đới thập cẩm (nho, dưa hấu, xoài, thanh long)', 'kg', 10.000, 40.000, 85000.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. Danh sách 10 món ăn nhà hàng tiệc Việt Nam (giá tính cho 01 phần/đĩa phục vụ 1 bàn 10 khách)
INSERT INTO dishes (code, name, description, image_url, price, status, category_id)
VALUES
    (
        'DISH-001',
        'Gỏi Ngó Sen Tôm Thịt Hoàng Gia',
        'Ngó sen giòn ngọt trộn tôm sú tươi, thịt heo ba chỉ thái mỏng, rau răm, đậu phộng rang và nước mắm chua ngọt đậm đà kèm bánh phồng tôm.',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
        260000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'KHAI_VI')
    ),
    (
        'DISH-002',
        'Súp Hải Sản Nấm Đông Cô Tuyết Nhĩ',
        'Súp sánh mịn nấu từ nước dùng gà ta, tôm sú hạt lựu, mực tươi và nấm đông cô thơm dịu, giữ ấm mở màn bàn tiệc.',
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
        240000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'KHAI_VI')
    ),
    (
        'DISH-003',
        'Tôm Sú Hấp Nước Dừa Xiêm',
        'Tôm sú loại 1 hấp trực tiếp trong trái dừa xiêm tươi giữ trọn vị ngọt tự nhiên, trình bày sang trọng trên bàn tiệc.',
        'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80',
        450000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'HAI_SAN')
    ),
    (
        'DISH-004',
        'Cá Chẽm Hấp Hồng Kông Xì Dầu',
        'Cá chẽm tươi nguyên con hấp chín tới với gừng sợi, hành lá và sốt xì dầu Thượng Hải thơm lừng.',
        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80',
        420000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'HAI_SAN')
    ),
    (
        'DISH-005',
        'Mực Ống Chiên Giòn Xóc Tỏi Ớt',
        'Mực ống tươi cắt khoanh tẩm bột chiên vàng giòn rụm, xóc cùng tỏi phi bơ và ớt sừng thơm cay hấp dẫn.',
        'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80',
        360000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'HAI_SAN')
    ),
    (
        'DISH-006',
        'Bò Hầm Tiêu Xanh Phú Quốc Kèm Bánh Mì',
        'Thăn bò mềm mọng hầm chậm cùng tiêu xanh Phú Quốc, nấm đông cô và rau củ trong sốt vang đỏ đậm vị.',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
        480000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'THIT_GIA_CAM')
    ),
    (
        'DISH-007',
        'Gà Ta Hấp Lá Chanh Xôi Hạt Sen',
        'Gà ta thả vườn da giòn thịt chắc hấp lá chanh thơm ngát, phục vụ kèm xôi hạt sen Huế dẻo bùi.',
        'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80',
        390000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'THIT_GIA_CAM')
    ),
    (
        'DISH-008',
        'Sườn Non Nướng Mật Ong Thảo Mộc',
        'Sườn non heo ướp mật ong rừng và thảo mộc nướng vàng óng, thịt mềm róc xương dùng kèm salad rau củ.',
        'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80',
        370000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'THIT_GIA_CAM')
    ),
    (
        'DISH-009',
        'Lẩu Hải Sản Chua Cay Thập Cẩm',
        'Nước lẩu chua cay đậm đà ăn kèm tôm sú, mực ống, cá chẽm phi lê, nấm tươi, rau lẩu theo mùa và bún tươi.',
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80',
        520000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'LAU_CANH')
    ),
    (
        'DISH-010',
        'Chè Hạt Sen Long Nhãn & Trái Cây Nhiệt Đới',
        'Chè hạt sen Huế nấu đường phèn thanh mát kết hợp đĩa trái cây tươi theo mùa tráng miệng cuối tiệc.',
        'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80',
        180000.00,
        'ACTIVE',
        (SELECT id FROM dish_categories WHERE code = 'TRANG_MIENG')
    )
ON CONFLICT (code) DO NOTHING;

-- 4. Công thức định lượng nguyên liệu cho 01 phần món (quantity > 0)
-- DISH-001: Gỏi Ngó Sen Tôm Thịt Hoàng Gia
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-001'), (SELECT id FROM ingredients WHERE code = 'ING-NGO-SEN'), 0.450, 'Ngó sen bào ngâm giòn'),
    ((SELECT id FROM dishes WHERE code = 'DISH-001'), (SELECT id FROM ingredients WHERE code = 'ING-TOM-SU'), 0.250, 'Tôm sú hấp bóc vỏ'),
    ((SELECT id FROM dishes WHERE code = 'DISH-001'), (SELECT id FROM ingredients WHERE code = 'ING-SUON-HEO'), 0.200, 'Thịt heo luộc thái sợi')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-002: Súp Hải Sản Nấm Đông Cô Tuyết Nhĩ
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-002'), (SELECT id FROM ingredients WHERE code = 'ING-TOM-SU'), 0.200, 'Tôm sú cắt hạt lựu'),
    ((SELECT id FROM dishes WHERE code = 'DISH-002'), (SELECT id FROM ingredients WHERE code = 'ING-MUC-ONG'), 0.150, 'Mực tươi thái nhỏ'),
    ((SELECT id FROM dishes WHERE code = 'DISH-002'), (SELECT id FROM ingredients WHERE code = 'ING-NAM-DONG-CO'), 0.200, 'Nấm đông cô thái sợi')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-003: Tôm Sú Hấp Nước Dừa Xiêm
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-003'), (SELECT id FROM ingredients WHERE code = 'ING-TOM-SU'), 0.750, 'Tôm sú nguyên con loại 1'),
    ((SELECT id FROM dishes WHERE code = 'DISH-003'), (SELECT id FROM ingredients WHERE code = 'ING-RAU-CU-LAU'), 0.200, 'Rau trang trí và gia vị hấp')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-004: Cá Chẽm Hấp Hồng Kông Xì Dầu
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-004'), (SELECT id FROM ingredients WHERE code = 'ING-CA-CHEM'), 1.100, 'Cá chẽm tươi nguyên con 1.1kg'),
    ((SELECT id FROM dishes WHERE code = 'DISH-004'), (SELECT id FROM ingredients WHERE code = 'ING-NAM-DONG-CO'), 0.150, 'Nấm đông cô hấp kèm'),
    ((SELECT id FROM dishes WHERE code = 'DISH-004'), (SELECT id FROM ingredients WHERE code = 'ING-RAU-CU-LAU'), 0.200, 'Hành lá, gừng sợi, ớt sừng')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-005: Mực Ống Chiên Giòn Xóc Tỏi Ớt
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-005'), (SELECT id FROM ingredients WHERE code = 'ING-MUC-ONG'), 0.700, 'Mực ống tươi cắt khoanh'),
    ((SELECT id FROM dishes WHERE code = 'DISH-005'), (SELECT id FROM ingredients WHERE code = 'ING-RAU-CU-LAU'), 0.150, 'Tỏi, ớt sừng, xà lách lót đĩa')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-006: Bò Hầm Tiêu Xanh Phú Quốc Kèm Bánh Mì
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-006'), (SELECT id FROM ingredients WHERE code = 'ING-BO-MY'), 0.750, 'Thịt bò cắt quân cờ'),
    ((SELECT id FROM dishes WHERE code = 'DISH-006'), (SELECT id FROM ingredients WHERE code = 'ING-NAM-DONG-CO'), 0.200, 'Nấm đông cô hầm cùng bò'),
    ((SELECT id FROM dishes WHERE code = 'DISH-006'), (SELECT id FROM ingredients WHERE code = 'ING-RAU-CU-LAU'), 0.300, 'Khoai tây, cà rốt, tiêu xanh')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-007: Gà Ta Hấp Lá Chanh Xôi Hạt Sen
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-007'), (SELECT id FROM ingredients WHERE code = 'ING-GA-TA'), 1.300, 'Gà ta nguyên con 1.3kg'),
    ((SELECT id FROM dishes WHERE code = 'DISH-007'), (SELECT id FROM ingredients WHERE code = 'ING-HAT-SEN'), 0.250, 'Hạt sen nấu xôi ăn kèm')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-008: Sườn Non Nướng Mật Ong Thảo Mộc
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-008'), (SELECT id FROM ingredients WHERE code = 'ING-SUON-HEO'), 0.900, 'Sườn non heo chặt miếng dài'),
    ((SELECT id FROM dishes WHERE code = 'DISH-008'), (SELECT id FROM ingredients WHERE code = 'ING-RAU-CU-LAU'), 0.250, 'Salad rau củ ăn kèm')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-009: Lẩu Hải Sản Chua Cay Thập Cẩm
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-009'), (SELECT id FROM ingredients WHERE code = 'ING-TOM-SU'), 0.400, 'Tôm sú ăn lẩu'),
    ((SELECT id FROM dishes WHERE code = 'DISH-009'), (SELECT id FROM ingredients WHERE code = 'ING-MUC-ONG'), 0.350, 'Mực ống cắt hoa'),
    ((SELECT id FROM dishes WHERE code = 'DISH-009'), (SELECT id FROM ingredients WHERE code = 'ING-CA-CHEM'), 0.350, 'Cá chẽm phi lê'),
    ((SELECT id FROM dishes WHERE code = 'DISH-009'), (SELECT id FROM ingredients WHERE code = 'ING-NAM-DONG-CO'), 0.250, 'Nấm ăn lẩu'),
    ((SELECT id FROM dishes WHERE code = 'DISH-009'), (SELECT id FROM ingredients WHERE code = 'ING-RAU-CU-LAU'), 0.600, 'Rau lẩu tổng hợp'),
    ((SELECT id FROM dishes WHERE code = 'DISH-009'), (SELECT id FROM ingredients WHERE code = 'ING-BUN-TUOI'), 0.800, 'Bún tươi ăn kèm')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;

-- DISH-010: Chè Hạt Sen Long Nhãn & Trái Cây Nhiệt Đới
INSERT INTO recipe_items (dish_id, ingredient_id, quantity, note)
VALUES
    ((SELECT id FROM dishes WHERE code = 'DISH-010'), (SELECT id FROM ingredients WHERE code = 'ING-HAT-SEN'), 0.300, 'Hạt sen tươi nấu chè'),
    ((SELECT id FROM dishes WHERE code = 'DISH-010'), (SELECT id FROM ingredients WHERE code = 'ING-TRAI-CAY'), 0.800, 'Đĩa trái cây thập cẩm')
ON CONFLICT (dish_id, ingredient_id) DO NOTHING;
