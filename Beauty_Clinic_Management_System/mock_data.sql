-- ========================================================
-- Description: สคริปต์เพิ่มข้อมูลตัวอย่าง (Mock Data)
-- Project: Beauty Clinic Management System
-- Updated: 03 Dec 2025 (Based on Real Product List)
-- ========================================================

USE beauty_clinic_db;

-- 1. เพิ่มข้อมูลพนักงาน (Staff)
-- อ้างอิงจากไฟล์: รายชื่อพนักงาน.csv
INSERT INTO Staff (full_name, position, username, password_hash) VALUES 
('นพ. เลโอ (หมอ LEO)', 'Doctor', 'dr_leo', '$2a$12$R9h/cIPz0...'), -- Password: 1234
('กิ๊ฟท์ (ผู้ช่วย)', 'Therapist', 'gift_therapist', '$2a$12$R9h/cIPz0...'),
('เบียร์ (ผู้ช่วย)', 'Therapist', 'beer_therapist', '$2a$12$R9h/cIPz0...'),
('ครีม (ผู้ช่วย)', 'Therapist', 'cream_therapist', '$2a$12$R9h/cIPz0...'),
('พิ้งกี้ (ผู้ช่วย)', 'Therapist', 'pinky_therapist', '$2a$12$R9h/cIPz0...'),
('Admin May', 'Admin', 'admin_may', '$2a$12$R9h/cIPz0...'),
('TEAM JIIN', 'Sale', 'sale_jiin', '$2a$12$R9h/cIPz0...'),
('TEAM นัทตี้', 'Sale', 'sale_nutty', '$2a$12$R9h/cIPz0...'),
('TEAM จี', 'Sale', 'sale_gee', '$2a$12$R9h/cIPz0...'),
('TEAM บี', 'Sale', 'sale_bee', '$2a$12$R9h/cIPz0...');

-- 2. เพิ่มข้อมูลลูกค้า (Customer)
-- อ้างอิงจากไฟล์: ฐานข้อมูลคนไข้.csv
INSERT INTO Customer (hn_code, first_name, last_name, nickname, phone_number, member_level, personal_consult, drug_allergy, address) 
VALUES 
-- ระดับ Platinum (สูงสุด)
('00001', 'ภูธเนศ', 'สภา', 'ภู', '092-5125145', 'Platinum', 'TEAM JIIN', NULL, '123 ถ.ศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000'),

-- ระดับ Platinum Gold (รองลงมา)
('00002', 'มัลลิกา', 'หาญพละ', 'มล', '093-4810506', 'Platinum Gold', 'TEAM JIIN', 'แพ้ Penicillin', '52 ม.2 ต.หนองปลิง อ.เมืองมหาสารคาม จ.มหาสารคาม 44000'),

-- ระดับ Gold (มาตรฐาน VIP)
('00003', 'สิทธิชัย', 'วันแก้ว', 'สิทธิ์', '085-7544739', 'Gold', 'TEAM บี', NULL, '88 หมู่ 5 ต.ท่าขอนยาง อ.กันทรวิชัย จ.มหาสารคาม 44150'),
('07533', 'อานัลตาชา', 'ชมชื่น', 'แอน', '098-4342611', 'Gold', 'TEAM นัทตี้', NULL, '456 ถ.แจ้งสนิท ต.บรบือ อ.บรบือ จ.มหาสารคาม 44130'),

-- ระดับ General (ลูกค้าทั่วไป)
('07491', 'กชกร', 'จันทาชัยภูมิ', 'กอหญ้า', '081-9998888', 'General', 'TEAM จี', NULL, '789 ถ.ริมคลองสมถวิล ต.ตลาด อ.เมือง จ.มหาสารคาม 44000');

-- 3. เพิ่มข้อมูลสินค้าจริง (Real Product Data)
-- อ้างอิงจากลิสต์ที่คุณให้มาล่าสุด แบ่งตามหมวดหมู่และ Logic การตัดสต๊อก

-- หมวด 1: Botox (Liquid: ตัดเป็น Unit)
INSERT INTO Product (product_name, category, main_unit, sub_unit, pack_size, is_liquid, standard_price, staff_price) VALUES
('Botox Aestox (50u)', 'Botox', 'ขวด', 'Unit', 50, TRUE, 3999, 2000),
('Botox Aestox (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 5999, 3000),
('Botox Allergan (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 12900, 6000),
('Botox Xeomin (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 9900, 5000),
('Botox Nabota (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 6900, 3500),
('Botox Nabota (200u)', 'Botox', 'ขวด', 'Unit', 200, TRUE, 12900, 6500),
('Botox Bienox (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 4999, 2500),
('Botox BTXA (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 3999, 2000),
('Botox MBTOX (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 3500, 1800),
('Botox Neuranox (100u)', 'Botox', 'ขวด', 'Unit', 100, TRUE, 3500, 1800);

-- หมวด 2: Filler (Solid: ตัดเต็มจำนวน หรือ Liquid: ถ้าแบ่งฉีด)
-- ตั้งค่า default เป็น FALSE (ตัดเป็นกล่อง/CC เต็มจำนวน) ถ้าแบ่งฉีดค่อยแก้เป็น TRUE
INSERT INTO Product (product_name, category, main_unit, sub_unit, pack_size, is_liquid, standard_price, staff_price) VALUES
('Filler Neuramis Deep', 'Filler', 'กล่อง', 'CC', 1, FALSE, 3900, 2000),
('Filler Neuramis Volume', 'Filler', 'กล่อง', 'CC', 1, FALSE, 3900, 2000),
('Filler Restylane Vita Light', 'Filler', 'กล่อง', 'CC', 1, FALSE, 12000, 6000),
('Filler Restylane Kysse', 'Filler', 'กล่อง', 'CC', 1, FALSE, 14000, 7000),
('Filler Flore S', 'Filler', 'กล่อง', 'CC', 1, FALSE, 4500, 2200),
('Filler Juvederm Ultra XC', 'Filler', 'กล่อง', 'CC', 1, FALSE, 11000, 5500),
('Filler Juvederm Voluma', 'Filler', 'กล่อง', 'CC', 1, FALSE, 13000, 6500),
('Filler Elasty D Plus', 'Filler', 'กล่อง', 'CC', 1, FALSE, 4500, 2200),
('Filler Elasty G Plus', 'Filler', 'กล่อง', 'CC', 1, FALSE, 4500, 2200),
('Filler Elasty F Plus', 'Filler', 'กล่อง', 'CC', 1, FALSE, 4500, 2200),
('Filler e.p.t.q ส้ม', 'Filler', 'กล่อง', 'CC', 1, FALSE, 5900, 3000),
('Filler e.p.t.q เขียว', 'Filler', 'กล่อง', 'CC', 1, FALSE, 5900, 3000),
('Filler e.p.t.q น้ำเงิน', 'Filler', 'กล่อง', 'CC', 1, FALSE, 5900, 3000),
('Filler Revolax Deep', 'Filler', 'กล่อง', 'CC', 1, FALSE, 4900, 2500);

-- หมวด 3: Fat (Liquid: ตัดเป็น ML)
-- Pack size ตามปริมาณ ml ข้างขวด
INSERT INTO Product (product_name, category, main_unit, sub_unit, pack_size, is_liquid, standard_price, staff_price) VALUES
('Fat Lipo System (10ml)', 'Fat', 'ขวด', 'ML', 10, TRUE, 2500, 1000),
('Fat Bromi (10ml)', 'Fat', 'ขวด', 'ML', 10, TRUE, 2900, 1200),
('Fat Babi (10ml)', 'Fat', 'ขวด', 'ML', 10, TRUE, 2900, 1200),
('Fat Sisi Face (10ml)', 'Fat', 'ขวด', 'ML', 10, TRUE, 3500, 1500),
('Fat SiSi Body (35ml)', 'Fat', 'ขวด', 'ML', 35, TRUE, 4500, 2000);

-- หมวด 4: ไหม (Thread) (Solid: ตัดเป็นเส้น)
-- สมมติ 1 ซอง = 10 เส้น
INSERT INTO Product (product_name, category, main_unit, sub_unit, pack_size, is_liquid, standard_price, staff_price) VALUES
('ไหมก้างปลา 19G', 'Thread', 'ซอง', 'เส้น', 10, FALSE, 5000, 2000),
('ไหม PDO 27G', 'Thread', 'ซอง', 'เส้น', 10, FALSE, 3000, 1500),
('ไหม Mono 29G', 'Thread', 'ซอง', 'เส้น', 10, FALSE, 3000, 1500),
('ไหม MINT 15cm', 'Thread', 'ซอง', 'เส้น', 4, FALSE, 8000, 4000); -- Mint มักจะมี 4 เส้น/ซอง

-- หมวด 5: งานผิว (Skin/Injection) - จุดซับซ้อน
INSERT INTO Product (product_name, category, main_unit, sub_unit, pack_size, is_liquid, standard_price, staff_price) VALUES
-- Rejuran: 1 กล่อง = 2 หลอด (หลอดละ 2cc) -> รวมเป็น 4 CC (Liquid Logic)
('Rejuran Healer', 'Skin', 'กล่อง', 'CC', 4, TRUE, 9900, 4500),

-- Sculptra/Juvelook: ผสมทั้งขวด -> ตัดเป็นขวด (Solid Logic)
('Sculptra', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 25000, 15000),
('Juvelook', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 22000, 12000),

-- ยาขวดอื่นๆ (ตัดเป็น ML ตามปริมาณ)
('Clapio (10ml)', 'Skin', 'ขวด', 'ML', 10, TRUE, 1500, 500),
('Derma Care (10ml)', 'Skin', 'ขวด', 'ML', 10, TRUE, 1500, 500),
('Chanel L-ebss', 'Skin', 'ขวด', 'ML', 3, TRUE, 3500, 1500), -- ปกติ 3ml
('Gluta Max C', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 1500, 500), -- ส่วนใหญ่ฉีดทั้งขวด
('Balamin (3ml)', 'Skin', 'ขวด', 'ML', 3, TRUE, 1200, 400),
('Neoderm', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 1000, 300),
('Neoclear', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 1000, 300),
('Wink White', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 1500, 500),
('Gluta Naxt (4ml)', 'Skin', 'ขวด', 'ML', 4, TRUE, 1500, 500),
('Made Guna (4ml)', 'Skin', 'ขวด', 'ML', 4, TRUE, 2500, 1000), -- 2หลอดคู่ = 4ml
('Meso Celeb', 'Skin', 'ขวด', 'ขวด', 1, FALSE, 2500, 1000);

-- ========================================================
-- 4. สร้างสต๊อกเริ่มต้น (Initial Inventory)
-- สมมติให้ทุกอย่างมีของ 10 หน่วยหลัก
-- ========================================================
INSERT INTO Inventory (product_id, full_qty, opened_qty)
SELECT product_id, 10, 0 FROM Product;

-- ปรับแต่งสต๊อกบางตัวให้สมจริง (มีขวดเปิด)
-- Botox Aestox 100u: เหลือเศษ 30 Unit
UPDATE Inventory SET opened_qty = 30 WHERE product_id = (SELECT product_id FROM Product WHERE product_name = 'Botox Aestox (100u)');
-- Rejuran: เหลือเศษ 2 CC (1 หลอด)
UPDATE Inventory SET opened_qty = 2 WHERE product_id = (SELECT product_id FROM Product WHERE product_name = 'Rejuran Healer');

-- ========================================================
-- 5. เพิ่มข้อมูลตัวอย่างการขาย (Transaction & Debt)
-- ========================================================

-- Case A: ขายสด จ่ายครบ (Botox)
INSERT INTO Transaction_Header (customer_id, staff_id, total_amount, discount, net_amount, payment_status, remaining_balance) 
VALUES (4, 6, 3999, 0, 3999, 'PAID', 0); -- ลูกค้าคนที่ 4 (คุณอานัลตาชา), Admin ขาย

INSERT INTO Transaction_Item (transaction_id, product_id, qty_used, unit_price, subtotal_price)
VALUES (LAST_INSERT_ID(), (SELECT product_id FROM Product WHERE product_name='Botox Aestox (50u)'), 50, 3999, 3999);

INSERT INTO Payment_Log (transaction_id, staff_id, amount_paid, payment_method)
VALUES (LAST_INSERT_ID(), 6, 3999, 'TRANSFER');

INSERT INTO Fee_Log (transaction_id, staff_id, fee_type, amount)
VALUES (LAST_INSERT_ID(), 1, 'DF', 500), (LAST_INSERT_ID(), 2, 'HAND_FEE', 50); -- หมอ LEO + กิ๊ฟท์

-- Case B: ผ่อนชำระ (Installment)
INSERT INTO Transaction_Header (customer_id, staff_id, total_amount, discount, net_amount, payment_status, remaining_balance) 
VALUES (5, 6, 2999, 0, 2999, 'PARTIAL', 2700); -- ลูกค้าคนที่ 5 (คุณกชกร) ยอด 2999 จ่ายไป 299 เหลือ 2700

INSERT INTO Transaction_Item (transaction_id, product_id, qty_used, unit_price, subtotal_price)
VALUES (LAST_INSERT_ID(), (SELECT product_id FROM Product WHERE product_name='Filler Neuramis Deep'), 1, 2999, 2999);

INSERT INTO Payment_Log (transaction_id, staff_id, amount_paid, payment_method)
VALUES (LAST_INSERT_ID(), 6, 299, 'TRANSFER'); -- งวดที่ 1


-- ========================================================
-- เพิ่มข้อมูลตัวอย่างรูปภาพ (Gallery & Stock Evidence)
-- ========================================================

-- 1. เพิ่มรูป Before/After ของลูกค้า (Patient Gallery)
-- สมมติลูกค้าคนที่ 4 (คุณอานัลตาชา) มาฉีด Botox วันที่ 30 พ.ย.
INSERT INTO Patient_Gallery (customer_id, transaction_id, image_type, image_path, taken_date, notes)
VALUES 
-- รูป Before
(4, 1, 'Before', '/uploads/patients/hn07533/20251130_before_front.jpg', '2025-11-30', 'หน้าตรง ก่อนฉีดกราม'),
(4, 1, 'Before', '/uploads/patients/hn07533/20251130_before_side.jpg', '2025-11-30', 'ด้านข้าง เห็นกรามชัด'),
-- รูป After (สมมติว่ามีการติดตามผล)
(4, 1, 'After', '/uploads/patients/hn07533/20251214_after_front.jpg', '2025-12-14', 'หลังฉีด 2 สัปดาห์ กรามเล็กลงชัดเจน');

-- สมมติลูกค้าคนที่ 2 (คุณมัลลิกา) มาทำ Filler
INSERT INTO Patient_Gallery (customer_id, transaction_id, image_type, image_path, taken_date, notes)
VALUES
(2, NULL, 'Before', '/uploads/patients/hn00002/20251125_chin_before.jpg', '2025-11-25', 'ก่อนฉีดคาง 1cc');


-- 2. เพิ่มข้อมูลตัวอย่าง Stock Movement ที่มีรูปภาพหลักฐาน (Evidence Image)
-- (ต้องมีข้อมูลในตาราง Stock_Movement ก่อนหน้านี้ หรือ Insert ใหม่)

-- ตัวอย่าง: รับของเข้า (Stock In) มีรูปใบส่งของ
INSERT INTO Stock_Movement (product_id, staff_id, action_type, qty_main, qty_sub, lot_number, expiry_date, evidence_image, note)
VALUES 
((SELECT product_id FROM Product WHERE product_name='Botox Aestox (100u)'), 6, 'IN', 10, 1000, 'LOT-A100', '2026-12-31', '/uploads/stock/in_20251201_inv001.jpg', 'รับของล็อตใหม่ ครบถ้วน');

-- ตัวอย่าง: โอนของไปสาขาอื่น (Transfer) มีรูปกล่องพัสดุ
INSERT INTO Stock_Movement (product_id, staff_id, action_type, qty_main, qty_sub, evidence_image, note)
VALUES 
((SELECT product_id FROM Product WHERE product_name='Filler Neuramis Deep'), 6, 'TRANSFER', 2, 2, '/uploads/stock/transfer_20251202_box.jpg', 'โอนให้สาขาสารคาม');

-- ตัวอย่าง: ตัดของเสีย (Adjustment - Broken) มีรูปขวดแตก
INSERT INTO Stock_Movement (product_id, staff_id, action_type, qty_main, qty_sub, evidence_image, note)
VALUES 
((SELECT product_id FROM Product WHERE product_name='Botox Nabota (100u)'), 2, 'ADJUST_DAMAGED', 1, 100, '/uploads/stock/adjust_20251203_broken.jpg', 'ผู้ช่วยทำหล่นแตกขณะผสม');