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

-- (SET FOREIGN_KEY_CHECKS = 1 is at the very bottom of this file)

-- ========================================================
-- ส่วนที่ 13: Category (หมวดหมู่สำหรับ Settings)
-- ========================================================
TRUNCATE TABLE category;
INSERT INTO category (id, type, name, code, description, is_active, sort_order) VALUES
(1,  'PRODUCT',    'บอทอกซ์',        'Botox',      'สินค้ากลุ่มบอทอกซ์ทุกยี่ห้อ',     1, 1),
(2,  'PRODUCT',    'ฟิลเลอร์',        'Filler',     'ฟิลเลอร์ทุกชนิด',                 1, 2),
(3,  'PRODUCT',    'ร้อยไหม',         'Thread',     'ไหม PDO, HIFU thread',            1, 3),
(4,  'PRODUCT',    'ยา/เวชภัณฑ์',     'Medicine',   'ยาและเวชภัณฑ์ที่ใช้ในคลินิก',      1, 4),
(5,  'PRODUCT',    'อุปกรณ์',         'Equipment',  'เข็ม cannula และอุปกรณ์อื่นๆ',    1, 5),
(6,  'PRODUCT',    'สกินแคร์',        'Skin',       'ผลิตภัณฑ์ดูแลผิว',                1, 6),
(7,  'PRODUCT',    'ทรีตเมนต์',       'Treatment',  'สารสลายไขมันและทรีตเมนต์อื่นๆ',   1, 7),
(8,  'COMMISSION', 'บอทอกซ์',        'COMM_BOT',   'อัตราค่ามือสำหรับบอทอกซ์',        1, 1),
(9,  'COMMISSION', 'ฟิลเลอร์',        'COMM_FIL',   'อัตราค่ามือสำหรับฟิลเลอร์',       1, 2),
(10, 'COMMISSION', 'ร้อยไหม',         'COMM_THR',   'อัตราค่ามือสำหรับร้อยไหม',        1, 3),
(11, 'COMMISSION', 'Drip',            'COMM_DRP',   'อัตราค่ามือสำหรับ Drip',          1, 4),
(12, 'COMMISSION', 'ทรีตเมนต์อื่น',  'COMM_OTH',   'อัตราค่ามือสำหรับบริการอื่นๆ',    1, 5);

-- ========================================================
-- ส่วนที่ 14: Commission Rate (อัตราค่ามือ)
-- ========================================================
TRUNCATE TABLE commission_rate;
INSERT INTO commission_rate (id, category, item_name, rate_amount, position_type, is_active) VALUES
(1,  'COMM_BOT', 'Botox ทั่วหน้า',       300.00, 'Doctor',    1),
(2,  'COMM_BOT', 'Botox กราม',            300.00, 'Doctor',    1),
(3,  'COMM_FIL', 'Filler (ทุกตำแหน่ง)', 500.00, 'Doctor',    1),
(4,  'COMM_THR', 'ร้อยไหม Face Lift',    400.00, 'Doctor',    1),
(5,  'COMM_OTH', 'Rejuran',               600.00, 'Doctor',    1),
(6,  'COMM_OTH', 'Sculptra',              800.00, 'Doctor',    1),
(7,  'COMM_DRP', 'Drip IV',               100.00, 'Doctor',    1),
(8,  'COMM_BOT', 'Botox ทั่วหน้า',       150.00, 'Therapist', 1),
(9,  'COMM_BOT', 'Botox กราม',            150.00, 'Therapist', 1),
(10, 'COMM_FIL', 'Filler (ทุกตำแหน่ง)', 200.00, 'Therapist', 1),
(11, 'COMM_THR', 'ร้อยไหม Face Lift',    200.00, 'Therapist', 1),
(12, 'COMM_DRP', 'Drip IV',               100.00, 'Therapist', 1);

-- ========================================================
-- ส่วนที่ 15: Historical Transactions (ย้อนหลัง 2 เดือน)
-- NOTE: transaction_id 1-15 มีอยู่แล้วด้านบน
-- ========================================================
INSERT INTO transaction_header (transaction_id, customer_id, staff_id, transaction_date, total_amount, discount, net_amount, remaining_balance, payment_status, channel) VALUES
-- มกราคม 2026 (~55-40 วันที่แล้ว)
(16,  1,  8, DATE_SUB(NOW(), INTERVAL 58 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(17,  2,  9, DATE_SUB(NOW(), INTERVAL 57 DAY),  9900.00,    0,  9900.00,    0, 'PAID',    'BOOKING'),
(18,  3, 10, DATE_SUB(NOW(), INTERVAL 56 DAY),  3900.00,    0,  3900.00,    0, 'PAID',    'WALK_IN'),
(19,  4,  8, DATE_SUB(NOW(), INTERVAL 55 DAY),  1500.00,    0,  1500.00,    0, 'PAID',    'WALK_IN'),
(20,  5,  9, DATE_SUB(NOW(), INTERVAL 54 DAY), 25000.00,    0, 25000.00,    0, 'PAID',    'BOOKING'),
(21,  6, 10, DATE_SUB(NOW(), INTERVAL 53 DAY),  5900.00,    0,  5900.00,    0, 'PAID',    'WALK_IN'),
(22,  7,  8, DATE_SUB(NOW(), INTERVAL 52 DAY),  2999.00,    0,  2999.00,    0, 'PAID',    'WALK_IN'),
(23,  8,  9, DATE_SUB(NOW(), INTERVAL 51 DAY),  4500.00,  500,  4000.00,    0, 'PAID',    'BOOKING'),
(24,  9, 10, DATE_SUB(NOW(), INTERVAL 50 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(25, 10,  8, DATE_SUB(NOW(), INTERVAL 49 DAY), 12000.00,    0, 12000.00,    0, 'PAID',    'BOOKING'),
(26, 11,  9, DATE_SUB(NOW(), INTERVAL 48 DAY),  3900.00,    0,  3900.00,    0, 'PAID',    'WALK_IN'),
(27, 12, 10, DATE_SUB(NOW(), INTERVAL 46 DAY),  9900.00,    0,  9900.00,    0, 'PAID',    'WALK_IN'),
(28, 13,  8, DATE_SUB(NOW(), INTERVAL 45 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'BOOKING'),
(29, 14,  9, DATE_SUB(NOW(), INTERVAL 44 DAY),  1500.00,    0,  1500.00,    0, 'PAID',    'WALK_IN'),
(30, 15, 10, DATE_SUB(NOW(), INTERVAL 43 DAY),  4500.00,    0,  4500.00,    0, 'PAID',    'WALK_IN'),
(31,  1,  8, DATE_SUB(NOW(), INTERVAL 42 DAY),  3900.00,    0,  3900.00,    0, 'PAID',    'BOOKING'),
(32,  2,  9, DATE_SUB(NOW(), INTERVAL 41 DAY),  2500.00,    0,  2500.00,    0, 'PAID',    'WALK_IN'),
(33,  3, 10, DATE_SUB(NOW(), INTERVAL 40 DAY),  5900.00,    0,  5900.00,    0, 'PAID',    'WALK_IN'),
(34,  4,  8, DATE_SUB(NOW(), INTERVAL 38 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(35,  5,  9, DATE_SUB(NOW(), INTERVAL 37 DAY),  9900.00,    0,  9900.00,    0, 'PAID',    'BOOKING'),
-- กุมภาพันธ์ 2026 (~35-20 วันที่แล้ว)
(36,  6, 10, DATE_SUB(NOW(), INTERVAL 35 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(37,  7,  8, DATE_SUB(NOW(), INTERVAL 34 DAY), 12000.00,    0, 12000.00,    0, 'PAID',    'BOOKING'),
(38,  8,  9, DATE_SUB(NOW(), INTERVAL 33 DAY),  3900.00,  300,  3600.00,    0, 'PAID',    'WALK_IN'),
(39,  9, 10, DATE_SUB(NOW(), INTERVAL 32 DAY), 25000.00,    0, 25000.00,    0, 'PAID',    'BOOKING'),
(40, 10,  8, DATE_SUB(NOW(), INTERVAL 31 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(41, 11,  9, DATE_SUB(NOW(), INTERVAL 30 DAY),  4500.00,    0,  4500.00,    0, 'PAID',    'WALK_IN'),
(42, 12, 10, DATE_SUB(NOW(), INTERVAL 28 DAY),  1500.00,    0,  1500.00,    0, 'PAID',    'BOOKING'),
(43, 13,  8, DATE_SUB(NOW(), INTERVAL 27 DAY),  9900.00,    0,  9900.00,    0, 'PAID',    'WALK_IN'),
(44, 14,  9, DATE_SUB(NOW(), INTERVAL 26 DAY),  2999.00,    0,  2999.00, 2999.00, 'UNPAID', 'WALK_IN'),
(45, 15, 10, DATE_SUB(NOW(), INTERVAL 25 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
-- มีนาคม 2026 (~22-6 วันที่แล้ว)
(46,  1,  8, DATE_SUB(NOW(), INTERVAL 22 DAY),  5900.00,    0,  5900.00,    0, 'PAID',    'BOOKING'),
(47,  2,  9, DATE_SUB(NOW(), INTERVAL 21 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(48,  3, 10, DATE_SUB(NOW(), INTERVAL 20 DAY),  3900.00,    0,  3900.00,    0, 'PAID',    'WALK_IN'),
(49,  4,  8, DATE_SUB(NOW(), INTERVAL 19 DAY), 12000.00, 1000, 11000.00,    0, 'PAID',    'BOOKING'),
(50,  5,  9, DATE_SUB(NOW(), INTERVAL 18 DAY),  4500.00,    0,  4500.00,    0, 'PAID',    'WALK_IN'),
(51,  6, 10, DATE_SUB(NOW(), INTERVAL 17 DAY),  9900.00,    0,  9900.00,    0, 'PAID',    'BOOKING'),
(52,  7,  8, DATE_SUB(NOW(), INTERVAL 16 DAY),  3999.00,    0,  3999.00,    0, 'PAID',    'WALK_IN'),
(53,  8,  9, DATE_SUB(NOW(), INTERVAL 11 DAY), 25000.00,    0, 25000.00,    0, 'PAID',    'BOOKING'),
(54,  9, 10, DATE_SUB(NOW(), INTERVAL 9  DAY),  3900.00,    0,  3900.00, 3900.00, 'UNPAID','WALK_IN'),
(55, 10,  8, DATE_SUB(NOW(), INTERVAL 6  DAY),  5900.00,    0,  5900.00,    0, 'PAID',    'BOOKING');

INSERT INTO transaction_item (transaction_id, product_id, course_id, qty, unit_price, subtotal) VALUES
(16, NULL, 1,  1,  3999.00,  3999.00), (17, NULL, 7,  1,  9900.00,  9900.00),
(18, NULL, 4,  1,  3900.00,  3900.00), (19, NULL, 8,  1,  1500.00,  1500.00),
(20, NULL, 11, 1, 25000.00, 25000.00), (21, NULL, 12, 1,  5900.00,  5900.00),
(22, NULL, 6,  1,  2999.00,  2999.00), (23, NULL, 2,  1,  4000.00,  4000.00),
(24, NULL, 1,  1,  3999.00,  3999.00), (25, NULL, 9,  1, 12000.00, 12000.00),
(26, NULL, 3,  1,  3900.00,  3900.00), (27, NULL, 7,  1,  9900.00,  9900.00),
(28, NULL, 1,  1,  3999.00,  3999.00), (29, NULL, 8,  1,  1500.00,  1500.00),
(30, NULL, 2,  1,  4500.00,  4500.00), (31, NULL, 3,  1,  3900.00,  3900.00),
(32, NULL, 8,  1,  2500.00,  2500.00), (33, NULL, 12, 1,  5900.00,  5900.00),
(34, NULL, 1,  1,  3999.00,  3999.00), (35, NULL, 7,  1,  9900.00,  9900.00),
(36, NULL, 1,  1,  3999.00,  3999.00), (37, NULL, 9,  1, 12000.00, 12000.00),
(38, NULL, 4,  1,  3600.00,  3600.00), (39, NULL, 11, 1, 25000.00, 25000.00),
(40, NULL, 1,  1,  3999.00,  3999.00), (41, NULL, 5,  1,  4500.00,  4500.00),
(42, NULL, 8,  1,  1500.00,  1500.00), (43, NULL, 7,  1,  9900.00,  9900.00),
(44, NULL, 6,  1,  2999.00,  2999.00), (45, NULL, 1,  1,  3999.00,  3999.00),
(46, NULL, 12, 1,  5900.00,  5900.00), (47, NULL, 1,  1,  3999.00,  3999.00),
(48, NULL, 3,  1,  3900.00,  3900.00), (49, NULL, 9,  1, 11000.00, 11000.00),
(50, NULL, 5,  1,  4500.00,  4500.00), (51, NULL, 7,  1,  9900.00,  9900.00),
(52, NULL, 1,  1,  3999.00,  3999.00), (53, NULL, 11, 1, 25000.00, 25000.00),
(54, NULL, 4,  1,  3900.00,  3900.00), (55, NULL, 12, 1,  5900.00,  5900.00);

INSERT INTO payment_log (transaction_id, staff_id, amount_paid, payment_method, payment_date) VALUES
(16, 10,  3999.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 58 DAY)),
(17, 10,  9900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 57 DAY)),
(18, 10,  3900.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 56 DAY)),
(19, 10,  1500.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 55 DAY)),
(20, 10, 25000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 54 DAY)),
(21, 10,  5900.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 53 DAY)),
(22, 10,  2999.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 52 DAY)),
(23, 10,  4000.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 51 DAY)),
(24, 10,  3999.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 50 DAY)),
(25, 10, 12000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 49 DAY)),
(26, 10,  3900.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 48 DAY)),
(27, 10,  9900.00, 'CREDIT',   DATE_SUB(NOW(), INTERVAL 46 DAY)),
(28, 10,  3999.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(29, 10,  1500.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 44 DAY)),
(30, 10,  4500.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 43 DAY)),
(31, 10,  3900.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 42 DAY)),
(32, 10,  2500.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 41 DAY)),
(33, 10,  5900.00, 'CREDIT',   DATE_SUB(NOW(), INTERVAL 40 DAY)),
(34, 10,  3999.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 38 DAY)),
(35, 10,  9900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 37 DAY)),
(36, 10,  3999.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 35 DAY)),
(37, 10, 12000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 34 DAY)),
(38, 10,  3600.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 33 DAY)),
(39, 10, 25000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 32 DAY)),
(40, 10,  3999.00, 'CREDIT',   DATE_SUB(NOW(), INTERVAL 31 DAY)),
(41, 10,  4500.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(42, 10,  1500.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 28 DAY)),
(43, 10,  9900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 27 DAY)),
(45, 10,  3999.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 25 DAY)),
(46, 10,  5900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 22 DAY)),
(47, 10,  3999.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 21 DAY)),
(48, 10,  3900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(49, 10, 11000.00, 'CREDIT',   DATE_SUB(NOW(), INTERVAL 19 DAY)),
(50, 10,  4500.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 18 DAY)),
(51, 10,  9900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 17 DAY)),
(52, 10,  3999.00, 'CASH',     DATE_SUB(NOW(), INTERVAL 16 DAY)),
(53, 10, 25000.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 11 DAY)),
(55, 10,  5900.00, 'TRANSFER', DATE_SUB(NOW(), INTERVAL 6  DAY));

-- Customer Courses สำหรับ historical transactions
INSERT INTO customer_course (customer_id, course_id, transaction_id, total_sessions, remaining_sessions, purchase_date, expiry_date, status) VALUES
(1,  7,  17, 1,  0, DATE_SUB(CURDATE(), INTERVAL 57 DAY), DATE_ADD(CURDATE(), INTERVAL 308 DAY), 'USED_UP'),
(5,  11, 20, 1,  0, DATE_SUB(CURDATE(), INTERVAL 54 DAY), DATE_ADD(CURDATE(), INTERVAL 311 DAY), 'USED_UP'),
(2,  9,  25, 10, 7, DATE_SUB(CURDATE(), INTERVAL 49 DAY), DATE_ADD(CURDATE(), INTERVAL 316 DAY), 'ACTIVE'),
(3,  9,  35, 10, 9, DATE_SUB(CURDATE(), INTERVAL 37 DAY), DATE_ADD(CURDATE(), INTERVAL 328 DAY), 'ACTIVE'),
(6,  9,  37, 10, 6, DATE_SUB(CURDATE(), INTERVAL 34 DAY), DATE_ADD(CURDATE(), INTERVAL 331 DAY), 'ACTIVE'),
(9,  11, 39, 1,  1, DATE_SUB(CURDATE(), INTERVAL 32 DAY), DATE_ADD(CURDATE(), INTERVAL 333 DAY), 'ACTIVE'),
(10, 7,  43, 1,  0, DATE_SUB(CURDATE(), INTERVAL 27 DAY), DATE_ADD(CURDATE(), INTERVAL 338 DAY), 'USED_UP'),
(8,  11, 53, 1,  1, DATE_SUB(CURDATE(), INTERVAL 11 DAY), DATE_ADD(CURDATE(), INTERVAL 354 DAY), 'ACTIVE');

-- ========================================================
-- ส่วนที่ 16: Appointment (นัดหมาย)
-- customer_course_id อ้างอิง id auto_increment จาก customer_course:
--   id 1 = (1,C1,tx1), 2=(2,C2,tx2), 3=(4,C3,tx3), 4=(1,C8,tx4)
--   5=(3,C1,tx5), 6=(8,C4,tx6), 7=(10,C7,tx7), 8=(5,C6,tx8)
--   9=(2,C8,tx9), 10=(7,C6,tx10), 11=(11,C1,tx11), 12=(13,C5,tx12)
--   13=(14,C8,tx13), 14=(12,C12,tx14), 15=(6,C9,tx15)
--   16=(1,C7,tx17), 17=(5,C11,tx20), 18=(2,C9,tx25)
--   19=(3,C9,tx35), 20=(6,C9,tx37), 21=(9,C11,tx39)
--   22=(10,C7,tx43), 23=(8,C11,tx53)
-- ========================================================
TRUNCATE TABLE appointment;
INSERT INTO appointment (id, customer_id, customer_course_id, appointment_date, duration_minutes, status, doctor_id, therapist_id, created_by, notes, updated_at) VALUES
-- วันนี้ (2026-03-03)
(1,  10, 7,  '2026-03-03 09:00:00', 60,  'SCHEDULED',  1, 3, 7, 'นัด Rejuran ครั้งแรก',           NOW()),
(2,  5,  8,  '2026-03-03 10:00:00', 90,  'SCHEDULED',  1, 4, 7, 'ร้อยไหม Face Lift',              NOW()),
(3,  1,  4,  '2026-03-03 11:30:00', 45,  'COMPLETED',  1, 3, 7, 'Drip Vit C บูสต์ผิว',           NOW()),
(4,  11, 11, '2026-03-03 13:00:00', 60,  'SCHEDULED',  2, 4, 7, 'Botox ทั่วหน้า',                NOW()),
(5,  7,  10, '2026-03-03 14:00:00', 120, 'SCHEDULED',  1, 3, 7, 'ร้อยไหม 2 เส้น',               NOW()),
(6,  13, 12, '2026-03-03 15:30:00', 60,  'CANCELLED',  2, 5, 7, 'Filler จมูก — ลูกค้ายกเลิก',  NOW()),
-- สัปดาห์นี้ (2026-03-04 ถึง 03-07)
(7,  2,  NULL,'2026-03-04 09:30:00', 60,  'SCHEDULED',  1, 3, 7, 'ปรึกษาการรักษา Botox',          NOW()),
(8,  3,  NULL,'2026-03-04 11:00:00', 60,  'SCHEDULED',  2, 4, 7, 'Follow-up หลังทำหัตถการ',       NOW()),
(9,  4,  NULL,'2026-03-05 09:00:00', 60,  'SCHEDULED',  1, 5, 7, 'Botox กราม',                   NOW()),
(10, 6,  20, '2026-03-05 10:30:00', 90,  'SCHEDULED',  2, 3, 7, 'Drip ผิวขาว ครั้งที่ 3',        NOW()),
(11, 8,  NULL,'2026-03-05 14:00:00', 45,  'SCHEDULED',  1, 4, 7, 'Consult Sculptra',              NOW()),
(12, 9,  NULL,'2026-03-06 09:00:00', 60,  'SCHEDULED',  2, 5, 7, 'Filler ปาก',                   NOW()),
(13, 14, 13, '2026-03-06 10:00:00', 45,  'SCHEDULED',  1, 3, 7, 'Drip วิตามินซีบูสต์',            NOW()),
(14, 15, NULL,'2026-03-07 10:00:00', 60,  'SCHEDULED',  2, 4, 7, 'Botox ริ้วรอย',                 NOW()),
-- สัปดาห์ที่แล้ว (COMPLETED / NO_SHOW)
(15, 1,  1,  DATE_SUB('2026-03-03 09:00:00', INTERVAL 7 DAY), 60, 'COMPLETED', 1, 3, 7, 'Botox ริ้วรอย เสร็จแล้ว',  NOW()),
(16, 2,  2,  DATE_SUB('2026-03-03 10:00:00', INTERVAL 7 DAY), 60, 'COMPLETED', 2, 4, 7, 'Botox กราม เสร็จแล้ว',    NOW()),
(17, 4,  3,  DATE_SUB('2026-03-03 11:00:00', INTERVAL 7 DAY), 60, 'COMPLETED', 1, 3, 7, 'Filler คาง',              NOW()),
(18, 10, NULL,DATE_SUB('2026-03-03 14:00:00', INTERVAL 7 DAY), 60, 'NO_SHOW',  2, 5, 7, 'ไม่มา ไม่แจ้งล่วงหน้า',   NOW()),
(19, 12, 14, DATE_SUB('2026-03-03 15:00:00', INTERVAL 7 DAY), 60, 'COMPLETED', 1, 4, 7, 'Fat Dissolving หน้าท้อง', NOW()),
(20, 6,  15, DATE_SUB('2026-03-03 09:00:00', INTERVAL 14 DAY),45, 'COMPLETED', 2, 3, 7, 'Drip ผิวขาว ครั้งที่ 2',  NOW());

-- ========================================================
-- ส่วนที่ 17: Service Usage (ประวัติการรักษา)
-- ========================================================
TRUNCATE TABLE service_usage;
INSERT INTO service_usage (usage_id, service_date, customer_id, customer_course_id, transaction_id, doctor_id, therapist_id, created_by, service_name, note) VALUES
(1,  DATE_SUB(NOW(), INTERVAL 15 DAY), 1,  1,  1,  1, 3, 7, 'Botox Aestox ริ้วรอย',           'ฉีด 60u ทั่วหน้า ผลดีมาก'),
(2,  DATE_SUB(NOW(), INTERVAL 14 DAY), 2,  2,  2,  2, 4, 7, 'Botox กราม Aestox',               'ลดขนาดกราม 2 ข้าง 50u'),
(3,  DATE_SUB(NOW(), INTERVAL 12 DAY), 4,  3,  3,  1, 3, 7, 'Filler คาง 1cc',                  'Neuramis Deep คางยาวขึ้น'),
(4,  DATE_SUB(NOW(), INTERVAL 10 DAY), 1,  4,  4,  2, 4, 7, 'Drip ผิวขาว Premium',             'VitC 1500mg + Gluta 600mg'),
(5,  DATE_SUB(NOW(), INTERVAL 8  DAY), 3,  5,  5,  1, 3, 7, 'Botox Aestox ริ้วรอย',           'ฉีด 55u ผลเยี่ยม'),
(6,  DATE_SUB(NOW(), INTERVAL 7  DAY), 8,  6,  6,  2, 5, 7, 'Filler ปาก 1cc',                 'e.p.t.q ปากอิ่มสวย'),
(7,  DATE_SUB(NOW(), INTERVAL 5  DAY), 10, 7,  7,  1, 4, 7, 'Rejuran หน้าใส 2cc',             'Rejuran 2cc ทั่วหน้า'),
(8,  DATE_SUB(NOW(), INTERVAL 3  DAY), 5,  8,  8,  2, 3, 7, 'ร้อยไหม Face Lift 4 เส้น',      'PDO 19G 4 เส้น ยกกระชับดี'),
(9,  DATE_SUB(NOW(), INTERVAL 2  DAY), 2,  9,  9,  1, 5, 7, 'Drip ผิวขาว Premium',            'Gluta 600mg solo IV push'),
(10, DATE_SUB(NOW(), INTERVAL 57 DAY), 1,  16, 17, 2, 4, 7, 'Rejuran หน้าใส 2cc',             'ครั้งแรก กระตุ้น collagen'),
(11, DATE_SUB(NOW(), INTERVAL 54 DAY), 5,  17, 20, 1, 3, 7, 'Sculptra 1 ขวด',                'inject 4 จุด เซสชั่นแรก'),
(12, DATE_SUB(NOW(), INTERVAL 49 DAY), 2,  18, 25, 2, 5, 7, 'Drip ผิวขาว คร.1/10',           'เริ่มต้นแพ็กเกจ 10 ครั้ง'),
(13, DATE_SUB(NOW(), INTERVAL 42 DAY), 2,  18, NULL, 1, 4, 7,'Drip ผิวขาว คร.2/10',           'ผิวสว่างขึ้น'),
(14, DATE_SUB(NOW(), INTERVAL 35 DAY), 2,  18, NULL, 2, 3, 7,'Drip ผิวขาว คร.3/10',           'ผิวขาวชัดเจน'),
(15, DATE_SUB(NOW(), INTERVAL 14 DAY), 6,  20, NULL, 1, 5, 7,'Drip ผิวขาว คร.2/10',           'ต่อเนื่องแพ็กเกจ');

-- ========================================================
-- ส่วนที่ 18: Fee Log (ค่ามือ DF + Hand Fee)
-- ========================================================
TRUNCATE TABLE fee_log;
INSERT INTO fee_log (fee_id, usage_id, staff_id, fee_type, amount) VALUES
(1,  1,  1, 'DF',       300.00), (2,  1,  3, 'HAND_FEE', 150.00),
(3,  2,  2, 'DF',       300.00), (4,  2,  4, 'HAND_FEE', 150.00),
(5,  3,  1, 'DF',       500.00), (6,  3,  3, 'HAND_FEE', 200.00),
(7,  4,  2, 'DF',       100.00), (8,  4,  4, 'HAND_FEE', 100.00),
(9,  5,  1, 'DF',       300.00), (10, 5,  3, 'HAND_FEE', 150.00),
(11, 6,  2, 'DF',       500.00), (12, 6,  5, 'HAND_FEE', 200.00),
(13, 7,  1, 'DF',       600.00), (14, 7,  4, 'HAND_FEE', 200.00),
(15, 8,  2, 'DF',       400.00), (16, 8,  3, 'HAND_FEE', 200.00),
(17, 9,  1, 'DF',       100.00), (18, 9,  6, 'HAND_FEE', 100.00),
(19, 10, 2, 'DF',       600.00), (20, 10, 4, 'HAND_FEE', 200.00),
(21, 11, 1, 'DF',       800.00), (22, 11, 3, 'HAND_FEE', 200.00),
(23, 12, 2, 'DF',       100.00), (24, 12, 5, 'HAND_FEE', 100.00),
(25, 13, 1, 'DF',       100.00), (26, 13, 4, 'HAND_FEE', 100.00),
(27, 14, 2, 'DF',       100.00), (28, 14, 3, 'HAND_FEE', 100.00),
(29, 15, 1, 'DF',       100.00), (30, 15, 5, 'HAND_FEE', 100.00);

-- ========================================================
-- ส่วนที่ 19: Inventory Usage (สินค้าที่เบิกใช้ต่อ Service)
-- ========================================================
TRUNCATE TABLE inventory_usage;
INSERT INTO inventory_usage (id, usage_id, product_id, qty_used, lot_number) VALUES
(1,  1,  1,  60, 'LOT-BOT-2412'),
(2,  2,  1,  50, 'LOT-BOT-2412'),
(3,  3,  4,  1,  'LOT-NEU-2412'),
(4,  4,  7,  2,  'LOT-VIT-2412'),
(5,  4,  8,  1,  NULL),
(6,  5,  1,  55, 'LOT-BOT-2412'),
(7,  6,  5,  1,  NULL),
(8,  7,  9,  2,  NULL),
(9,  8,  11, 4,  NULL),
(10, 9,  8,  1,  NULL),
(11, 10, 9,  2,  NULL),
(12, 11, 10, 1,  NULL),
(13, 12, 7,  2,  'LOT-VIT-2412'),
(14, 13, 7,  2,  'LOT-VIT-2412'),
(15, 14, 7,  2,  'LOT-VIT-2412'),
(16, 15, 7,  2,  'LOT-VIT-2412');

-- ========================================================
-- ส่วนที่ 20: Customer Deposit (ระบบมัดจำลูกค้า VIP)
-- ========================================================
TRUNCATE TABLE customer_deposit;
INSERT INTO customer_deposit (id, customer_id, transaction_id, amount, type, balance_after, note, created_at, created_by) VALUES
(1, 1,  NULL, 10000.00, 'ADD',    10000.00, 'เติมมัดจำครั้งแรก VIP',    DATE_SUB(NOW(), INTERVAL 60 DAY), 7),
(2, 1,  NULL,  3999.00, 'DEDUCT',  6001.00, 'หักค่า Botox บิล #1',      DATE_SUB(NOW(), INTERVAL 15 DAY), 10),
(3, 1,  NULL,  1500.00, 'DEDUCT',  4501.00, 'หักค่า Drip บิล #4',       DATE_SUB(NOW(), INTERVAL 10 DAY), 10),
(4, 2,  NULL,  5000.00, 'ADD',     5000.00, 'เติมมัดจำ',                 DATE_SUB(NOW(), INTERVAL 55 DAY), 7),
(5, 2,  NULL,  2500.00, 'DEDUCT',  2500.00, 'หักค่า Drip Gluta',         DATE_SUB(NOW(), INTERVAL 2  DAY), 10),
(6, 10, NULL, 20000.00, 'ADD',    20000.00, 'Pre-pay Sculptra package',  DATE_SUB(NOW(), INTERVAL 50 DAY), 7),
(7, 10, NULL,  9900.00, 'DEDUCT', 10100.00, 'หักค่า Rejuran บิล #7',     DATE_SUB(NOW(), INTERVAL 5  DAY), 10),
(8, 4,  NULL,  8000.00, 'ADD',     8000.00, 'มัดจำก่อนทำ Sculptra',      DATE_SUB(NOW(), INTERVAL 30 DAY), 7);

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- สรุปข้อมูลทั้งหมด (หลัง Import ไฟล์นี้):
-- Staff:            10 คน (Doctor 2, Therapist 4, Admin 1, Sale 2, Cashier 1)
-- Customer:         15 คน
-- Product:          15 รายการ
-- Course:           12 คอร์ส
-- Inventory:        15 รายการ
-- Stock Movement:   ~20 รายการ
-- Transaction:      55 บิล (PAID 51, PARTIAL 1, UNPAID 3)
-- Transaction Item: 55 รายการ
-- Payment Log:      51 รายการ
-- Customer Course:  23 คอร์สที่ซื้อ
-- Patient Gallery:  9 รูป
-- Appointment:      20 รายการ (วันนี้ 6 + สัปดาห์นี้ 8 + ผ่านมา 6)
-- Service Usage:    15 รายการ
-- Fee Log:          30 รายการ (DF 15 + HAND_FEE 15)
-- Inventory Usage:  16 รายการ
-- Customer Deposit: 8 รายการ
-- Category:         12 รายการ
-- Commission Rate:  12 รายการ
-- ========================================================