-- ========================================================
-- MOCK DATA: Beauty Clinic Management System
-- Run after: database_schema.sql
-- ========================================================

-- USE beauty_clinic_db; (DB specified via CLI)
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Staff (10 คน) - password: 123
-- --------------------------------------------------------
TRUNCATE TABLE staff;
INSERT INTO staff (staff_id, full_name, position, username, password_hash, is_active) VALUES
(1, 'นพ. เลโอ (หมอ LEO)', 'Doctor', 'dr_leo', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(2, 'พญ. สมหญิง (หมอญ)', 'Doctor', 'dr_ying', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(3, 'กิ๊ฟท์ (ผู้ช่วย)', 'Therapist', 'gift_therapist', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(4, 'เบียร์ (ผู้ช่วย)', 'Therapist', 'beer_therapist', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(5, 'ครีม (ผู้ช่วย)', 'Therapist', 'cream_therapist', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(6, 'พิ้งกี้ (ผู้ช่วย)', 'Therapist', 'pinky_therapist', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(7, 'Admin May', 'Admin', 'admin_may', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(8, 'TEAM JIIN', 'Sale', 'sale_jiin', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(9, 'TEAM นัทตี้', 'Sale', 'sale_nutty', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1),
(10, 'แคชเชียร์ นุ่น', 'Cashier', 'cashier_noon', '$2b$10$iBwDt/dG1n774zDBkuat1.Ki36OfcjmOTWpNtabo4N29WEEeY8Ixq', 1);


-- --------------------------------------------------------
-- 2. Customer (15 คน)
-- --------------------------------------------------------
TRUNCATE TABLE customer;
INSERT INTO customer (customer_id, hn_code, first_name, last_name, nickname, phone_number, member_level, drug_allergy, underlying_disease, address) VALUES
(1, '00001', 'ภูธเนศ', 'สภา', 'ภู', '092-5125145', 'Platinum', NULL, NULL, '123 ถ.ศรีจันทร์ ขอนแก่น'),
(2, '00002', 'มัลลิกา', 'หาญพละ', 'มล', '093-4810506', 'Platinum Gold', 'Penicillin, Sulfa', 'ความดันโลหิตสูง', '52 ม.2 มหาสารคาม'),
(3, '00003', 'สิทธิชัย', 'วันแก้ว', 'สิทธิ์', '085-7544739', 'Gold', NULL, NULL, '88 หมู่ 5 มหาสารคาม'),
(4, '07533', 'อานัลตาชา', 'ชมชื่น', 'แอน', '098-4342611', 'Gold', NULL, NULL, '456 ถ.แจ้งสนิท มหาสารคาม'),
(5, '07491', 'กชกร', 'จันทาชัยภูมิ', 'กอหญ้า', '081-9998888', 'General', NULL, NULL, '789 ริมคลองสมถวิล'),
(6, '07492', 'วิภาดา', 'รักดี', 'วิ', '089-1112222', 'General', 'Aspirin', 'เบาหวาน', 'ขอนแก่น'),
(7, '07493', 'ณัฐวุฒิ', 'ใจดี', 'นัท', '081-3334444', 'General', NULL, NULL, 'ร้อยเอ็ด'),
(8, '07494', 'พิมพ์ลภัส', 'สวยใส', 'พิม', '082-5556666', 'Silver', NULL, NULL, 'กาฬสินธุ์'),
(9, '07495', 'จิรายุ', 'ตั้งใจ', 'เจมส์', '083-7778888', 'Silver', 'Latex', NULL, 'ขอนแก่น'),
(10, '07496', 'มารีญา', 'พูลเลิศ', 'มารี', '084-9990000', 'Platinum', NULL, NULL, 'กทม.'),
(11, '07497', 'ศิริพร', 'แสงดาว', 'พร', '085-1234567', 'General', NULL, NULL, 'อุดรธานี'),
(12, '07498', 'ปิยะ', 'มั่นคง', 'ปิ', '086-2345678', 'Silver', 'NSAID', NULL, 'เลย'),
(13, '07499', 'สุภาพร', 'เจริญสุข', 'แอ๊ว', '087-3456789', 'Gold', NULL, 'ไทรอยด์', 'หนองคาย'),
(14, '07500', 'ธนพล', 'รุ่งเรือง', 'ท็อป', '088-4567890', 'General', NULL, NULL, 'ขอนแก่น'),
(15, '07501', 'อรอนงค์', 'ดวงใจ', 'อร', '089-5678901', 'General', 'Lidocaine', NULL, 'มหาสารคาม');

-- --------------------------------------------------------
-- 3. Product (15 รายการ)
-- --------------------------------------------------------
TRUNCATE TABLE product;
INSERT INTO product (product_id, product_code, product_name, category, main_unit, sub_unit, pack_size, is_liquid, cost_price, standard_price, staff_price, is_active) VALUES
(1, 'BOT-001', 'Botox Aestox (100u)', 'Botox', 'ขวด', 'Unit', 100, 1, 2500.00, 5999.00, 3000.00, 1),
(2, 'BOT-002', 'Botox Nabota (100u)', 'Botox', 'ขวด', 'Unit', 100, 1, 3000.00, 6900.00, 3500.00, 1),
(3, 'BOT-003', 'Botox Botulax (100u)', 'Botox', 'ขวด', 'Unit', 100, 1, 2200.00, 5499.00, 2800.00, 1),
(4, 'FIL-001', 'Filler Neuramis Deep', 'Filler', 'กล่อง', 'CC', 1, 0, 1500.00, 3900.00, 2000.00, 1),
(5, 'FIL-002', 'Filler e.p.t.q S100', 'Filler', 'กล่อง', 'CC', 1, 0, 2500.00, 5900.00, 3000.00, 1),
(6, 'FIL-003', 'Filler Juvederm Ultra', 'Filler', 'กล่อง', 'CC', 1, 0, 4000.00, 8900.00, 5000.00, 1),
(7, 'VIT-001', 'Vitamin C Injection', 'Medicine', 'กล่อง', 'Amp', 10, 1, 500.00, 1500.00, 800.00, 1),
(8, 'VIT-002', 'Glutathione 600mg', 'Medicine', 'กล่อง', 'Amp', 10, 1, 800.00, 2500.00, 1200.00, 1),
(9, 'SKN-001', 'Rejuran Healer', 'Skin', 'กล่อง', 'CC', 2, 1, 4000.00, 9900.00, 4500.00, 1),
(10, 'SKN-002', 'Sculptra', 'Skin', 'ขวด', 'ขวด', 1, 0, 12000.00, 25000.00, 15000.00, 1),
(11, 'EQP-001', 'PDO Thread 19G', 'Equipment', 'ซอง', 'เส้น', 10, 0, 1500.00, 5000.00, 2000.00, 1),
(12, 'EQP-002', 'Cannula 25G', 'Equipment', 'กล่อง', 'ชิ้น', 20, 0, 800.00, 2000.00, 1000.00, 1),
(13, 'MED-001', 'Fat Dissolving', 'Treatment', 'ขวด', 'ML', 10, 1, 800.00, 2500.00, 1000.00, 1),
(14, 'MED-002', 'Lidocaine 2%', 'Medicine', 'ขวด', 'ML', 20, 1, 50.00, 150.00, 80.00, 1),
(15, 'MED-003', 'NSS 100ml', 'Medicine', 'ขวด', 'ML', 100, 1, 20.00, 100.00, 30.00, 1);

-- --------------------------------------------------------
-- 4. Course (12 คอร์ส)
-- --------------------------------------------------------
TRUNCATE TABLE course;
INSERT INTO course (course_id, course_code, course_name, description, standard_price, is_active) VALUES
(1, 'C001', 'Botox Aestox ริ้วรอย', 'ไม่จำกัดยูนิต ทั่วหน้า', 3999.00, 1),
(2, 'C002', 'Botox กราม Aestox', 'ลดกราม ปรับหน้าเรียว 50u', 3999.00, 1),
(3, 'C003', 'Filler คาง 1cc', 'Neuramis Deep สร้างคางวีเชพ', 3900.00, 1),
(4, 'C004', 'Filler ปาก 1cc', 'ริมฝีปากอิ่ม ทรงสายฝอ', 3900.00, 1),
(5, 'C005', 'Filler จมูก 1cc', 'เสริมดั้ง ทรงธรรมชาติ', 4500.00, 1),
(6, 'C006', 'ร้อยไหม Face Lift 4 เส้น', 'PDO Thread ยกกระชับ', 2999.00, 1),
(7, 'C007', 'Rejuran หน้าใส 2cc', 'กระตุ้นคอลลาเจน', 9900.00, 1),
(8, 'C008', 'Drip ผิวขาว Premium', 'Gluta+VitC สูตรพรีเมียม', 1500.00, 1),
(9, 'C009', 'Drip ผิวขาว 10 ครั้ง', 'แพ็กเกจ 10 ครั้ง ประหยัดกว่า', 12000.00, 1),
(10, 'C010', 'Acne Clear 5 ครั้ง', 'กดสิว ฉีดสิว มาร์ค', 2500.00, 1),
(11, 'C011', 'Sculptra 1 ขวด', 'กระตุ้นคอลลาเจนจากภายใน', 25000.00, 1),
(12, 'C012', 'Fat สลายไขมันหน้าท้อง', 'ฉีดสลาย+กดกระชับ', 5900.00, 1);

-- --------------------------------------------------------
-- 4.1 Course_Item 
-- --------------------------------------------------------
TRUNCATE TABLE course_item;
INSERT INTO course_item (course_id, item_name, qty_limit) VALUES
(1, 'Botox ริ้วรอย', 1),
(2, 'Botox กราม', 1),
(3, 'Filler คาง', 1),
(4, 'Filler ปาก', 1),
(5, 'Filler จมูก', 1),
(6, 'ร้อยไหม', 1),
(7, 'Rejuran', 1),
(8, 'Drip Single', 1),
(9, 'Drip Package', 10),
(10, 'Acne Treatment', 5),
(11, 'Sculptra Session', 1),
(12, 'Fat Dissolving', 1);

-- --------------------------------------------------------
-- 5. Inventory (สต๊อกปัจจุบัน)
-- --------------------------------------------------------
TRUNCATE TABLE inventory;
INSERT INTO inventory (product_id, full_qty, opened_qty) VALUES
(1, 8, 40),   -- Aestox 8 ขวด + 40 unit เปิดแล้ว
(2, 5, 0),    -- Nabota
(3, 3, 60),   -- Botulax
(4, 12, 0),   -- Neuramis
(5, 8, 0),    -- e.p.t.q
(6, 4, 0),    -- Juvederm
(7, 15, 3),   -- VitC
(8, 10, 0),   -- Gluta
(9, 5, 1),    -- Rejuran
(10, 3, 0),   -- Sculptra
(11, 25, 0),  -- Thread
(12, 3, 8),   -- Cannula
(13, 6, 5),   -- Fat
(14, 20, 10), -- Lidocaine
(15, 50, 0);  -- NSS

-- --------------------------------------------------------
-- 6. Stock_Movement (ประวัติเคลื่อนไหว 30 วันล่าสุด)
-- --------------------------------------------------------
TRUNCATE TABLE stock_movement;
INSERT INTO stock_movement (product_id, staff_id, action_type, qty_main, qty_sub, lot_number, expiry_date, note, created_at) VALUES
-- รับเข้าสินค้า (IN)
(1, 7, 'IN', 10, 0, 'LOT-BOT-2412', '2026-12-01', 'รับจากตัวแทน', DATE_SUB(NOW(), INTERVAL 25 DAY)),
(2, 7, 'IN', 5, 0, 'LOT-NAB-2412', '2026-12-15', 'รับจากตัวแทน', DATE_SUB(NOW(), INTERVAL 25 DAY)),
(4, 7, 'IN', 15, 0, 'LOT-NEU-2412', '2026-06-01', 'รับจากตัวแทน', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(7, 7, 'IN', 20, 0, 'LOT-VIT-2412', '2025-06-01', 'รับจากตัวแทน', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(15, 7, 'IN', 50, 0, NULL, '2026-01-01', 'รับจากตัวแทน', DATE_SUB(NOW(), INTERVAL 20 DAY)),

-- เบิกใช้งาน (OUT)
(1, 3, 'OUT', 0, -30, NULL, NULL, 'ฉีด Botox คุณภู', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1, 3, 'OUT', 0, -50, NULL, NULL, 'ฉีด Botox คุณมล', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(4, 3, 'OUT', -1, 0, NULL, NULL, 'Filler คางคุณแอน', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(7, 4, 'OUT', 0, -2, NULL, NULL, 'Drip VitC คุณภู', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 3, 'OUT', 0, -40, NULL, NULL, 'ฉีด Botox คุณสิทธิ์', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 3, 'OUT', -1, 0, NULL, NULL, 'Filler ปากคุณพิม', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(9, 3, 'OUT', 0, -1, NULL, NULL, 'Rejuran คุณมารี', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 4, 'OUT', 0, -2, NULL, NULL, 'Drip VitC คุณกอหญ้า', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 4, 'OUT', 0, -1, NULL, NULL, 'Drip Gluta คุณมล', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- วันนี้
(1, 3, 'OUT', 0, -25, NULL, NULL, 'Botox คุณพร', NOW()),
(4, 3, 'OUT', -1, 0, NULL, NULL, 'Filler จมูกคุณแอ๊ว', NOW()),
(7, 4, 'OUT', 0, -2, NULL, NULL, 'Drip VitC คุณท็อป', NOW()),
(15, 4, 'OUT', 0, -3, NULL, NULL, 'ใช้ผสมยา', NOW()),

-- ปรับยอด
(12, 7, 'ADJUST_LOST', -2, 0, NULL, NULL, 'นับได้ไม่ครบ', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 7, 'IN', 1, 0, NULL, NULL, 'เจอเพิ่ม 1 ขวด', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- --------------------------------------------------------
-- 7. Transaction_Header (15 บิลขาย)
-- --------------------------------------------------------
TRUNCATE TABLE transaction_header;
INSERT INTO transaction_header (transaction_id, customer_id, staff_id, transaction_date, total_amount, discount, net_amount, remaining_balance, payment_status, channel) VALUES
(1, 1, 8, DATE_SUB(NOW(), INTERVAL 15 DAY), 3999.00, 0, 3999.00, 0, 'PAID', 'WALK_IN'),
(2, 2, 8, DATE_SUB(NOW(), INTERVAL 14 DAY), 4500.00, 500.00, 4000.00, 0, 'PAID', 'WALK_IN'),
(3, 4, 9, DATE_SUB(NOW(), INTERVAL 12 DAY), 3900.00, 0, 3900.00, 0, 'PAID', 'WALK_IN'),
(4, 1, 8, DATE_SUB(NOW(), INTERVAL 10 DAY), 1500.00, 0, 1500.00, 0, 'PAID', 'WALK_IN'),
(5, 3, 10, DATE_SUB(NOW(), INTERVAL 8 DAY), 3999.00, 0, 3999.00, 0, 'PAID', 'BOOKING'),
(6, 8, 9, DATE_SUB(NOW(), INTERVAL 7 DAY), 3900.00, 0, 3900.00, 0, 'PAID', 'WALK_IN'),
(7, 10, 8, DATE_SUB(NOW(), INTERVAL 5 DAY), 9900.00, 0, 9900.00, 0, 'PAID', 'BOOKING'),
(8, 5, 10, DATE_SUB(NOW(), INTERVAL 3 DAY), 2999.00, 0, 2999.00, 1999.00, 'PARTIAL', 'WALK_IN'),
(9, 2, 8, DATE_SUB(NOW(), INTERVAL 2 DAY), 2500.00, 0, 2500.00, 0, 'PAID', 'WALK_IN'),
(10, 7, 9, DATE_SUB(NOW(), INTERVAL 1 DAY), 5000.00, 0, 5000.00, 5000.00, 'UNPAID', 'BOOKING'),
(11, 11, 8, NOW(), 3999.00, 0, 3999.00, 0, 'PAID', 'WALK_IN'),
(12, 13, 9, NOW(), 4500.00, 0, 4500.00, 0, 'PAID', 'WALK_IN'),
(13, 14, 10, NOW(), 1500.00, 0, 1500.00, 0, 'PAID', 'WALK_IN'),
(14, 12, 8, DATE_SUB(NOW(), INTERVAL 20 DAY), 3500.00, 0, 3500.00, 3500.00, 'UNPAID', 'WALK_IN'),
(15, 6, 9, DATE_SUB(NOW(), INTERVAL 4 DAY), 12000.00, 0, 12000.00, 0, 'PAID', 'BOOKING');

-- --------------------------------------------------------
-- 8. Transaction_Item
-- --------------------------------------------------------
TRUNCATE TABLE transaction_item;
INSERT INTO transaction_item (transaction_id, product_id, course_id, qty, unit_price, subtotal) VALUES
(1, NULL, 1, 1, 3999.00, 3999.00),
(2, NULL, 2, 1, 4000.00, 4000.00),
(3, NULL, 3, 1, 3900.00, 3900.00),
(4, NULL, 8, 1, 1500.00, 1500.00),
(5, NULL, 1, 1, 3999.00, 3999.00),
(6, NULL, 4, 1, 3900.00, 3900.00),
(7, NULL, 7, 1, 9900.00, 9900.00),
(8, NULL, 6, 1, 2999.00, 2999.00),
(9, NULL, 8, 1, 2500.00, 2500.00),
(10, NULL, 6, 2, 2500.00, 5000.00),
(11, NULL, 1, 1, 3999.00, 3999.00),
(12, NULL, 5, 1, 4500.00, 4500.00),
(13, NULL, 8, 1, 1500.00, 1500.00),
(14, NULL, 12, 1, 3500.00, 3500.00),
(15, NULL, 9, 1, 12000.00, 12000.00);

-- --------------------------------------------------------
-- 9. Payment_Log
-- --------------------------------------------------------
TRUNCATE TABLE payment_log;
INSERT INTO payment_log (transaction_id, staff_id, amount_paid, payment_method, payment_date) VALUES
(1, 10, 3999.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 10, 2000.00, 'CASH', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(2, 10, 2000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(3, 10, 3900.00, 'CASH', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(4, 10, 1500.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(5, 10, 3999.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(6, 10, 3900.00, 'CASH', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(7, 10, 9900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(8, 10, 1000.00, 'CASH', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9, 10, 2500.00, 'CASH', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(11, 10, 3999.00, 'CASH', NOW()),
(12, 10, 4500.00, 'TRANSFER', NOW()),
(13, 10, 1500.00, 'CASH', NOW()),
(15, 10, 12000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- --------------------------------------------------------
-- 10. Customer_Course (กระเป๋าคอร์ส)
-- --------------------------------------------------------
TRUNCATE TABLE customer_course;
INSERT INTO customer_course (customer_id, course_id, transaction_id, total_sessions, remaining_sessions, expiry_date, status) VALUES
(1, 1, 1, 1, 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'USED_UP'),
(2, 2, 2, 1, 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'USED_UP'),
(4, 3, 3, 1, 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'USED_UP'),
(1, 8, 4, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(3, 1, 5, 1, 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'USED_UP'),
(8, 4, 6, 1, 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'USED_UP'),
(10, 7, 7, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(5, 6, 8, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(2, 8, 9, 1, 0, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'USED_UP'),
(7, 6, 10, 2, 2, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(11, 1, 11, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(13, 5, 12, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(14, 8, 13, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(12, 12, 14, 1, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),
(6, 9, 15, 10, 8, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE');

-- --------------------------------------------------------
-- 11. Fee_Log (ค่ามือ DF + Hand Fee)
-- Note: Fee_Log requires usage_id FK from Service_Usage
-- Skipping for now since Service_Usage is empty
-- --------------------------------------------------------
-- TRUNCATE TABLE Fee_Log;
-- Fee_Log data will be created when actual services are recorded

-- --------------------------------------------------------
-- 12. Patient_Gallery (รูปภาพก่อน/หลัง)
-- --------------------------------------------------------
TRUNCATE TABLE patient_gallery;
INSERT INTO patient_gallery (customer_id, usage_id, image_type, image_path, taken_date, notes) VALUES
(1, NULL, 'Before', '/uploads/gallery/1/before_botox.jpg', DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'ก่อนฉีด Botox'),
(1, NULL, 'After', '/uploads/gallery/1/after_botox.jpg', CURDATE(), 'หลังฉีด Botox 2 สัปดาห์'),
(2, NULL, 'Before', '/uploads/gallery/2/before_jaw.jpg', DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'ก่อนลดกราม'),
(2, NULL, 'After', '/uploads/gallery/2/after_jaw.jpg', CURDATE(), 'หลังลดกราม'),
(4, NULL, 'Before', '/uploads/gallery/4/before_chin.jpg', DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'ก่อนเติมคาง'),
(4, NULL, 'After', '/uploads/gallery/4/after_chin.jpg', DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'หลังเติมคาง'),
(10, NULL, 'Before', '/uploads/gallery/10/before_rejuran.jpg', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'ก่อน Rejuran'),
(8, NULL, 'Before', '/uploads/gallery/8/before_lips.jpg', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'ก่อนเติมปาก'),
(8, NULL, 'After', '/uploads/gallery/8/after_lips.jpg', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'หลังเติมปาก');

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- ข้อมูลสรุป:
-- - Staff: 10 คน (Doctor 2, Therapist 4, Admin 1, Sale 2, Cashier 1)
-- - Customer: 15 คน
-- - Product: 15 รายการ (Botox 3, Filler 3, Medicine 4, Skin 2, Equipment 2, Treatment 1)
-- - Course: 12 คอร์ส
-- - Inventory: 15 รายการ
-- - Stock Movement: 20 รายการ (IN, OUT, ADJUST)
-- - Transaction: 15 บิล (PAID 11, PARTIAL 1, UNPAID 3)
-- - Customer Course: 15 คอร์สที่ซื้อ
-- - Patient Gallery: 9 รูป
-- ========================================================