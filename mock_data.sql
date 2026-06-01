-- ========================================================
-- Seed Data for Beauty Clinic Management System (v3.0 - Expanded)
-- Table names are lower_case matching Prisma schema
-- Password for all staff accounts: Jin1234@
-- ========================================================

USE beauty_clinic_db;

-- Clear existing data (disable foreign key checks temporarily)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE customer_consent;
TRUNCATE TABLE patient_gallery;
TRUNCATE TABLE inventory_usage;
TRUNCATE TABLE fee_log;
TRUNCATE TABLE service_usage;
TRUNCATE TABLE appointment;
TRUNCATE TABLE customer_deposit;
TRUNCATE TABLE customer_course;
TRUNCATE TABLE payment_log;
TRUNCATE TABLE transaction_item;
TRUNCATE TABLE transaction_header;
TRUNCATE TABLE stock_movement;
TRUNCATE TABLE inventory;
TRUNCATE TABLE product;
TRUNCATE TABLE course_item;
TRUNCATE TABLE course;
TRUNCATE TABLE customer;
TRUNCATE TABLE staff;
TRUNCATE TABLE category;
TRUNCATE TABLE commission_rate;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Seed categories
INSERT INTO category (id, type, name, code, description, is_active, sort_order) VALUES
(1, 'PRODUCT', 'Botox', 'BOTOX', 'Botox injection products', 1, 1),
(2, 'PRODUCT', 'Filler', 'FILLER', 'Hyaluronic acid dermal fillers', 1, 2),
(3, 'PRODUCT', 'Treatment', 'TREATMENT', 'Skin treatments, fat lipo, threads, and meso', 1, 3),
(4, 'PRODUCT', 'Medicine', 'MEDICINE', 'Clinical drugs, oral medicines, and creams', 1, 4),
(5, 'PRODUCT', 'Equipment', 'EQUIPMENT', 'Clinical tools, needles, syringes, consumables', 1, 5),
(6, 'PRODUCT', 'Skin', 'SKIN', 'Skin care, serums, and gels', 1, 6),
(7, 'COMMISSION', 'Doctor Fee', 'DF', 'Doctor fee commission rates', 1, 1),
(8, 'COMMISSION', 'Hand Fee', 'HAND_FEE', 'Therapist/staff hand fee rates', 1, 2);

-- 2. Seed staff
-- Password hash is for: Jin1234@
INSERT INTO staff (staff_id, full_name, position, username, password_hash, token_version, must_change_password, is_active) VALUES
(1, 'Dr. Somsak Admin', 'Admin', 'admin', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1),
(2, 'Dr. Jin Arucha', 'Doctor', 'doctor1', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1),
(3, 'Dr. Pat Patra', 'Doctor', 'doctor2', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1),
(4, 'Ms. Anne Therapist', 'Therapist', 'therapist1', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1),
(5, 'Ms. Bow Therapist', 'Therapist', 'therapist2', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1),
(6, 'Mr. Charlie Cashier', 'Cashier', 'cashier1', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1),
(7, 'Ms. Diana Sale', 'Sale', 'sale1', '$2b$10$YSdXS70UjQl454knTuhLzuT0zjf.RGbGdM3dYPEYKi4iItVGpygRS', 0, 0, 1);

-- 3. Seed customers (15 Patients for a rich database directory)
INSERT INTO customer (customer_id, hn_code, id_card_number, first_name, last_name, full_name, nickname, phone_number, address, birth_date, drug_allergy, underlying_disease, member_level, is_active, created_at) VALUES
(1, 'HN-2026-0001', '1100100234567', 'สมชาย', 'ดีเลิศ', 'สมชาย ดีเลิศ', 'ชาย', '0812345678', '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', '1990-05-15', 'Penicillin (เพนนิซิลิน)', 'ไม่มี', 'Platinum', 1, '2026-05-01 10:00:00'),
(2, 'HN-2026-0002', '1200200345678', 'สมศรี', 'สุขสำราญ', 'สมศรี สุขสำราญ', 'ศรี', '0823456789', '88/9 หมู่ 3 ตำบลบางแก้ว อำเภอบางพลี จังหวัดสมุทรปราการ 10540', '1985-09-20', 'ไม่มี', 'เบาหวาน', 'Gold', 1, '2026-05-02 11:30:00'),
(3, 'HN-2026-0003', '1300300456789', 'เจนนี่', 'จอห์นสัน', 'เจนนี่ จอห์นสัน', 'เจนนี่', '0834567890', '456 ซอยทองหล่อ 10 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110', '1995-12-05', 'Aspirin (แอสไพริน)', 'หอบหืด', 'VIP', 1, '2026-05-03 14:15:00'),
(4, 'HN-2026-0004', '1400400567890', 'วิชัย', 'ฉลาดล้ำ', 'วิชัย ฉลาดล้ำ', 'วิน', '0845678901', '789 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', '1988-02-28', 'ไม่มี', 'ความดันโลหิตสูง', 'General', 1, '2026-05-04 09:45:00'),
(5, 'HN-2026-0005', '1500500678901', 'พลอย', 'ไพลิน', 'พลอย ไพลิน', 'พลอย', '0856789012', '99/1 ซอยอารีย์ แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400', '1992-07-10', 'ไม่มี', 'ไม่มี', 'General', 1, '2026-05-05 16:20:00'),
(6, 'HN-2026-0006', '1600600789012', 'อภิชาติ', 'รักษ์ดี', 'อภิชาติ รักษ์ดี', 'ตั้ม', '0867890123', '44/5 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', '1983-11-12', 'ไม่มี', 'ไขมันในเลือดสูง', 'General', 1, '2026-05-06 10:20:00'),
(7, 'HN-2026-0007', '1700700890123', 'นภา', 'สว่างศรี', 'นภา สว่างศรี', 'ฟ้า', '0878901234', '12 ซอยสุขุมวิท 39 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110', '1991-03-24', 'Sulfa (ซัลฟา)', 'ไม่มี', 'Gold', 1, '2026-05-07 14:40:00'),
(8, 'HN-2026-0008', '1800800901234', 'เกียรติศักดิ์', 'เจริญผล', 'เกียรติศักดิ์ เจริญผล', 'บอย', '0889012345', '234/5 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240', '1987-08-08', 'ไม่มี', 'ไม่มี', 'General', 1, '2026-05-08 11:10:00'),
(9, 'HN-2026-0009', '1900900012345', 'สุชาดา', 'มั่งมี', 'สุชาดา มั่งมี', 'สุ', '0890123456', '55 ถนนสาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ 10120', '1989-01-30', 'ไม่มี', 'โรคหัวใจ', 'Platinum', 1, '2026-05-09 15:50:00'),
(10, 'HN-2026-0010', '2001000123456', 'ธนพล', 'ปัญญาดี', 'ธนพล ปัญญาดี', 'ท็อป', '0801234567', '77/3 ถนนวิภาวดีรังสิต แขวงตลาดบางเขน เขตหลักสี่ กรุงเทพฯ 10210', '1994-06-18', 'ไม่มี', 'ภูมิแพ้', 'General', 1, '2026-05-10 09:15:00'),
(11, 'HN-2026-0011', '2101100234567', 'ชลดา', 'แก้ววิจิตร', 'ชลดา แก้ววิจิตร', 'น้ำ', '0813456789', '9/9 ซอยลาดพร้าว 101 แขวงคลองจั่น เขตบางกะปิ กรุงเทพฯ 10240', '1993-10-04', 'ไม่มี', 'ไม่มี', 'Gold', 1, '2026-05-11 13:25:00'),
(12, 'HN-2026-0012', '2201200345678', 'ธีรเดช', 'มีชัย', 'ธีรเดช มีชัย', 'ธี', '0824567890', '101 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', '1986-04-14', 'Ibuprofen (ไอบูโพรเฟน)', 'ไม่มี', 'General', 1, '2026-05-12 10:45:00'),
(13, 'HN-2026-0013', '2301300456789', 'วิภาดา', 'เลิศศิลป์', 'วิภาดา เลิศศิลป์', 'วิ', '0835678901', '33/1 ถนนรัชดาภิเษก แขวงจันทรเกษม เขตจตุจักร กรุงเทพฯ 10900', '1996-08-27', 'ไม่มี', 'ไม่มี', 'VIP', 1, '2026-05-13 16:10:00'),
(14, 'HN-2026-0014', '2401400567890', 'มนัส', 'บุญยืน', 'มนัส บุญยืน', 'นัส', '0846789012', '567 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400', '1981-12-19', 'ไม่มี', 'โรคไต', 'General', 1, '2026-05-14 11:30:00'),
(15, 'HN-2026-0015', '2501500678901', 'กัญญา', 'ศรีสุวรรณ', 'กัญญา ศรีสุวรรณ', 'ปู', '0857890123', '124 ซอยสุขุมวิท 101/1 แขวงบางจาก เขตพระโขนง กรุงเทพฯ 10260', '1990-09-09', 'ไม่มี', 'ไม่มี', 'Gold', 1, '2026-05-15 14:20:00');

-- 4. Seed 155 Products matching the Excel list
INSERT INTO product (product_id, product_code, product_name, category, main_unit, sub_unit, pack_size, is_liquid, cost_price, standard_price, staff_price, is_active) VALUES
-- 1. กลุ่มยาฉีดหน้า (Face Injections)
(1, 'P-001', 'Aestox 50 UNIT', 'Botox', 'Vial', 'Unit', 50, 1, 1800.00, 4500.00, 3500.00, 1),
(2, 'P-002', 'Aestox 100 UNIT', 'Botox', 'Vial', 'Unit', 100, 1, 3000.00, 7900.00, 6500.00, 1),
(3, 'P-003', 'BTXA 100 UNIT', 'Botox', 'Vial', 'Unit', 100, 1, 2800.00, 6900.00, 5500.00, 1),
(4, 'P-004', 'BIENOX 100 UNIT', 'Botox', 'Vial', 'Unit', 100, 1, 2500.00, 5900.00, 4800.00, 1),
(5, 'P-005', 'NATOTA 100 UNIT', 'Botox', 'Vial', 'Unit', 100, 1, 2200.00, 5500.00, 4500.00, 1),
(6, 'P-006', 'NATOTA 200 UNIT', 'Botox', 'Vial', 'Unit', 200, 1, 3800.00, 9900.00, 8000.00, 1),
(7, 'P-007', 'MBTOX 100 U', 'Botox', 'Vial', 'Unit', 100, 1, 2000.00, 4900.00, 4000.00, 1),
(8, 'P-008', 'XEOMIN 100 UNIT', 'Botox', 'Vial', 'Unit', 100, 1, 6500.00, 15000.00, 12000.00, 1),
(9, 'P-009', 'ALLEGAN 100 UNIT', 'Botox', 'Vial', 'Unit', 100, 1, 7500.00, 18000.00, 15000.00, 1),
(10, 'P-010', 'FILLER Neuramis ดำ', 'Filler', 'Syringe', 'CC', 1, 0, 1800.00, 4900.00, 3900.00, 1),
(11, 'P-011', 'FILLER Neuramis ทอง', 'Filler', 'Syringe', 'CC', 1, 0, 2200.00, 6500.00, 5000.00, 1),
(12, 'P-012', 'FILLER MAX 1400', 'Filler', 'Syringe', 'CC', 1, 0, 2500.00, 7500.00, 6000.00, 1),
(13, 'P-013', 'FILLER FLORE AQUA S', 'Filler', 'Syringe', 'CC', 1, 0, 2800.00, 8900.00, 7000.00, 1),
(14, 'P-014', 'FILLER FLORE S', 'Filler', 'Syringe', 'CC', 1, 0, 3000.00, 9900.00, 8000.00, 1),
(15, 'P-015', 'FILLER FLORE N', 'Filler', 'Syringe', 'CC', 1, 0, 3000.00, 9900.00, 8000.00, 1),
(16, 'P-016', 'FILLER FLORE MAX', 'Filler', 'Syringe', 'CC', 1, 0, 3200.00, 11000.00, 9000.00, 1),
(17, 'P-017', 'FILLER Retylune vila light', 'Filler', 'Syringe', 'CC', 1, 0, 5500.00, 14000.00, 11000.00, 1),
(18, 'P-018', 'FILLER Retylune vila Kysse', 'Filler', 'Syringe', 'CC', 1, 0, 6000.00, 15000.00, 12000.00, 1),
(19, 'P-019', 'FILLER Retylune lidocaine', 'Filler', 'Syringe', 'CC', 1, 0, 5800.00, 14500.00, 11500.00, 1),
(20, 'P-020', 'FILLER Beiotero', 'Filler', 'Syringe', 'CC', 1, 0, 6500.00, 16000.00, 13000.00, 1),
(21, 'P-021', 'E.P.T.Q (สีเขียว)', 'Filler', 'Syringe', 'CC', 1, 0, 2500.00, 6900.00, 5500.00, 1),
(22, 'P-022', 'E.P.T.Q (สีน้ำเงิน)', 'Filler', 'Syringe', 'CC', 1, 0, 2500.00, 6900.00, 5500.00, 1),
(23, 'P-023', 'E.P.T.Q (สีส้ม)', 'Filler', 'Syringe', 'CC', 1, 0, 2800.00, 7900.00, 6000.00, 1),
(24, 'P-024', 'ELASTY F plus เหลือง', 'Filler', 'Syringe', 'CC', 1, 0, 2400.00, 6000.00, 5000.00, 1),
(25, 'P-025', 'ELASTY G plus น้ำเงิน', 'Filler', 'Syringe', 'CC', 1, 0, 2400.00, 6000.00, 5000.00, 1),
(26, 'P-026', 'ELASTY D plus เขียว', 'Filler', 'Syringe', 'CC', 1, 0, 2600.00, 7000.00, 5500.00, 1),
(27, 'P-027', 'FAT LIPO SYSTEM', 'Treatment', 'Vial', 'ML', 10, 1, 600.00, 2500.00, 1800.00, 1),
(28, 'P-028', 'FAT LIPO CAFF', 'Treatment', 'Vial', 'ML', 10, 1, 500.00, 2200.00, 1500.00, 1),
(29, 'P-029', 'FAT BROMI', 'Treatment', 'Vial', 'ML', 10, 1, 700.00, 2900.00, 2000.00, 1),
(30, 'P-030', 'FAT BABI', 'Treatment', 'Vial', 'ML', 10, 1, 800.00, 3200.00, 2500.00, 1),
(31, 'P-031', 'FAT SISI BODY (ตัว)', 'Treatment', 'Vial', 'ML', 10, 1, 900.00, 3500.00, 2800.00, 1),
(32, 'P-032', 'FAT SISI Face', 'Treatment', 'Vial', 'ML', 10, 1, 900.00, 3500.00, 2800.00, 1),
(33, 'P-033', 'ไหมเรียบ 27 G', 'Treatment', 'Pack', 'Piece', 10, 0, 300.00, 1200.00, 900.00, 1),
(34, 'P-034', 'ไหมก้างปลา 19 G', 'Treatment', 'Pack', 'Piece', 10, 0, 800.00, 3500.00, 2500.00, 1),
(35, 'P-035', 'ไหม Mono 29 G', 'Treatment', 'Pack', 'Piece', 10, 0, 400.00, 1500.00, 1200.00, 1),
(36, 'P-036', 'MESO WHITE RAD', 'Treatment', 'Ampoule', 'ML', 5, 1, 400.00, 1800.00, 1200.00, 1),
(37, 'P-037', 'MESO X-DNA', 'Treatment', 'Ampoule', 'ML', 5, 1, 500.00, 2200.00, 1500.00, 1),
(38, 'P-038', 'BALAMIN', 'Treatment', 'Ampoule', 'ML', 5, 1, 200.00, 900.00, 700.00, 1),
(39, 'P-039', 'Dopa glow', 'Treatment', 'Ampoule', 'ML', 5, 1, 450.00, 1900.00, 1400.00, 1),
(40, 'P-040', 'clapio', 'Treatment', 'Ampoule', 'ML', 5, 1, 350.00, 1500.00, 1100.00, 1),
(41, 'P-041', 'เดอมาแคร์ Derma Care', 'Treatment', 'Ampoule', 'ML', 5, 1, 600.00, 2500.00, 1800.00, 1),
(42, 'P-042', 'MESO GLUTA NEX', 'Treatment', 'Ampoule', 'ML', 5, 1, 550.00, 2400.00, 1700.00, 1),
(43, 'P-043', 'MADE GUNA', 'Treatment', 'Ampoule', 'ML', 2, 1, 800.00, 3000.00, 2200.00, 1),
(44, 'P-044', 'Facial Life Essence', 'Treatment', 'Ampoule', 'ML', 5, 1, 700.00, 2800.00, 2000.00, 1),
(45, 'P-045', 'Salmon Essence', 'Treatment', 'Ampoule', 'ML', 5, 1, 900.00, 3500.00, 2500.00, 1),
(46, 'P-046', 'Neoclear', 'Treatment', 'Ampoule', 'ML', 5, 1, 300.00, 1200.00, 900.00, 1),
(47, 'P-047', 'Neoderm', 'Treatment', 'Ampoule', 'ML', 5, 1, 350.00, 1400.00, 1000.00, 1),
(48, 'P-048', 'Wink White', 'Treatment', 'Ampoule', 'ML', 5, 1, 400.00, 1600.00, 1200.00, 1),
-- P-049 missing as noted by user
(50, 'P-050', 'REJURUN CC / หลอด', 'Treatment', 'Syringe', 'CC', 1, 0, 4500.00, 9900.00, 8500.00, 1),
(51, 'P-051', 'จูวีลุค', 'Treatment', 'Vial', 'ML', 10, 1, 5000.00, 12000.00, 9900.00, 1),
(52, 'P-052', 'Gluta MAX-C', 'Treatment', 'Ampoule', 'ML', 5, 1, 350.00, 1500.00, 1100.00, 1),
(53, 'P-053', 'ชาแนล', 'Treatment', 'Vial', 'ML', 5, 1, 3500.00, 8900.00, 7000.00, 1),
(54, 'P-054', 'สลายFILLER', 'Treatment', 'Vial', 'ML', 5, 1, 800.00, 3000.00, 2000.00, 1),
(55, 'P-055', 'ยาชาแบบฉีด', 'Medicine', 'Vial', 'ML', 20, 1, 200.00, 800.00, 600.00, 1),
(56, 'P-056', 'ยาชาแบบทา (กระปุก)', 'Medicine', 'Jar', 'Gram', 450, 0, 1200.00, 3500.00, 2800.00, 1),

-- 2. กลุ่มยาผิว (Skin Care & Consumables)
(57, 'P-057', 'LUMIGEN', 'Skin', 'Ampoule', 'ML', 5, 1, 800.00, 2500.00, 1800.00, 1),
(58, 'P-058', 'PRO Q10', 'Skin', 'Ampoule', 'ML', 5, 1, 600.00, 1900.00, 1400.00, 1),
(59, 'P-059', 'SUPER WHITE', 'Skin', 'Ampoule', 'ML', 5, 1, 500.00, 1600.00, 1200.00, 1),
(60, 'P-060', 'Celeb Max', 'Skin', 'Ampoule', 'ML', 5, 1, 1200.00, 3500.00, 2800.00, 1),
(61, 'P-061', 'VIT C', 'Skin', 'Ampoule', 'ML', 2, 1, 50.00, 200.00, 150.00, 1),
(62, 'P-062', 'VIT B12', 'Skin', 'Ampoule', 'ML', 2, 1, 80.00, 250.00, 200.00, 1),
(63, 'P-063', 'TRIVIT B', 'Skin', 'Ampoule', 'ML', 2, 1, 100.00, 300.00, 250.00, 1),
(64, 'P-064', 'B100', 'Skin', 'Ampoule', 'ML', 2, 1, 120.00, 350.00, 300.00, 1),
(65, 'P-065', 'TRANSMIN INJ.', 'Skin', 'Ampoule', 'ML', 5, 1, 150.00, 500.00, 400.00, 1),
(66, 'P-066', 'ยาฆ่าเชื้อแบบฉีด', 'Medicine', 'Vial', 'ML', 10, 1, 180.00, 600.00, 450.00, 1),
(67, 'P-067', 'KANOLONE 10mg.', 'Medicine', 'Vial', 'ML', 1, 1, 100.00, 400.00, 300.00, 1),
(68, 'P-068', 'KANOLONE 40mg.', 'Medicine', 'Vial', 'ML', 1, 1, 250.00, 900.00, 700.00, 1),
(69, 'P-069', 'L-Carnitine', 'Skin', 'Ampoule', 'ML', 5, 1, 400.00, 1500.00, 1100.00, 1),
(70, 'P-070', 'NEEDLE NO.18', 'Equipment', 'Box', 'Piece', 100, 0, 150.00, 500.00, 400.00, 1),
(71, 'P-071', 'NEEDLE NO.21', 'Equipment', 'Box', 'Piece', 100, 0, 150.00, 500.00, 400.00, 1),
(72, 'P-072', 'NEEDLE NO.23', 'Equipment', 'Box', 'Piece', 100, 0, 150.00, 500.00, 400.00, 1),
(73, 'P-073', 'NEEDLE NO.24', 'Equipment', 'Box', 'Piece', 100, 0, 150.00, 500.00, 400.00, 1),
(74, 'P-074', 'NEEDLE NO.25', 'Equipment', 'Box', 'Piece', 100, 0, 150.00, 500.00, 400.00, 1),
(75, 'P-075', 'NEEDLE NO.30', 'Equipment', 'Box', 'Piece', 100, 0, 200.00, 600.00, 500.00, 1),
(76, 'P-076', 'ปีกผีเสื้อ no24', 'Equipment', 'Box', 'Piece', 50, 0, 250.00, 800.00, 650.00, 1),
(77, 'P-077', 'CATHERTER N24.', 'Equipment', 'Box', 'Piece', 50, 0, 300.00, 1000.00, 800.00, 1),
(78, 'P-078', 'CANNULA NO.22', 'Equipment', 'Box', 'Piece', 20, 0, 800.00, 2500.00, 2000.00, 1),
(79, 'P-079', 'CANNULA NO.23', 'Equipment', 'Box', 'Piece', 20, 0, 800.00, 2500.00, 2000.00, 1),
(80, 'P-080', 'CANNULA NO.25', 'Equipment', 'Box', 'Piece', 20, 0, 800.00, 2500.00, 2000.00, 1),
(81, 'P-081', 'SYRINGE INSURIN', 'Equipment', 'Box', 'Piece', 100, 0, 250.00, 800.00, 600.00, 1),
(82, 'P-082', 'SYRINGE 1 ml.', 'Equipment', 'Box', 'Piece', 100, 0, 300.00, 1000.00, 800.00, 1),
(83, 'P-083', 'SYRINGE 3 ml.', 'Equipment', 'Box', 'Piece', 100, 0, 350.00, 1200.00, 900.00, 1),
(84, 'P-084', 'SYRINGE 5 ml.', 'Equipment', 'Box', 'Piece', 100, 0, 400.00, 1300.00, 1000.00, 1),
(85, 'P-085', 'SYRINGE 10 ml.', 'Equipment', 'Box', 'Piece', 100, 0, 450.00, 1500.00, 1200.00, 1),
(86, 'P-086', 'SYRINGE 20 ml.', 'Equipment', 'Box', 'Piece', 50, 0, 300.00, 1000.00, 800.00, 1),
(87, 'P-087', 'Tude PRP 10ml.', 'Equipment', 'Box', 'Piece', 50, 0, 600.00, 2000.00, 1500.00, 1),
(88, 'P-088', 'SET IV', 'Equipment', 'Box', 'Piece', 50, 0, 400.00, 1500.00, 1200.00, 1),
(89, 'P-089', 'NSS 100 ml (INJ)', 'Medicine', 'Bottle', 'ML', 100, 1, 40.00, 150.00, 120.00, 1),
-- P-090 missing as noted by user
(91, 'P-091', 'GUAZE 4*4', 'Equipment', 'Box', 'Piece', 100, 0, 150.00, 400.00, 300.00, 1),
(92, 'P-092', 'MICROPORE 1 นิ้ว', 'Equipment', 'Box', 'Piece', 12, 0, 180.00, 500.00, 400.00, 1),

-- 3. กลุ่มของใช้ทรีทเม้น (Treatment Supplies)
(93, 'P-093', 'สำลีก้าน', 'Equipment', 'Pack', 'Piece', 100, 0, 20.00, 60.00, 50.00, 1),
(94, 'P-094', 'สำลีก้อน', 'Equipment', 'Pack', 'Piece', 200, 0, 35.00, 100.00, 80.00, 1),
(95, 'P-095', 'สำลีแผ่น เล็ก', 'Equipment', 'Pack', 'Piece', 150, 0, 30.00, 90.00, 75.00, 1),
(96, 'P-096', 'สำลีแผ่น ใหญ่', 'Equipment', 'Pack', 'Piece', 100, 0, 40.00, 120.00, 100.00, 1),
(97, 'P-097', 'COTTON SWAP S', 'Equipment', 'Pack', 'Piece', 100, 0, 25.00, 80.00, 60.00, 1),
(98, 'P-098', 'COTTON SWAP M', 'Equipment', 'Pack', 'Piece', 100, 0, 25.00, 80.00, 60.00, 1),
(99, 'P-099', 'COTTON SWAP L', 'Equipment', 'Pack', 'Piece', 100, 0, 30.00, 90.00, 70.00, 1),
(100, 'P-100', 'POVIDONE', 'Medicine', 'Bottle', 'ML', 450, 1, 120.00, 400.00, 300.00, 1),
(101, 'P-101', 'ALCOHOL 450 ml', 'Medicine', 'Bottle', 'ML', 450, 1, 40.00, 150.00, 120.00, 1),
(102, 'P-102', 'MASK', 'Equipment', 'Box', 'Piece', 50, 0, 50.00, 150.00, 120.00, 1),
(103, 'P-103', 'ถุงมือ S', 'Equipment', 'Box', 'Piece', 100, 0, 180.00, 500.00, 400.00, 1),
(104, 'P-104', 'ถุงมือ M', 'Equipment', 'Box', 'Piece', 100, 0, 180.00, 500.00, 400.00, 1),
(105, 'P-105', 'ฟิล์มแร๊ป', 'Equipment', 'Roll', 'Piece', 1, 0, 120.00, 400.00, 300.00, 1),
(106, 'P-106', 'หมวกคลุมผม', 'Equipment', 'Bag', 'Piece', 100, 0, 90.00, 300.00, 250.00, 1),
(107, 'P-107', 'กันแดดหน้า', 'Skin', 'Tube', 'Gram', 30, 0, 150.00, 450.00, 350.00, 1),
(108, 'P-108', 'กันแดดตัว', 'Skin', 'Bottle', 'ML', 100, 1, 200.00, 600.00, 500.00, 1),
(109, 'P-109', 'คลีนซิ่งผัก', 'Skin', 'Bottle', 'ML', 200, 1, 180.00, 500.00, 400.00, 1),
(110, 'P-110', 'ออยทาตัว', 'Skin', 'Bottle', 'ML', 300, 1, 100.00, 350.00, 280.00, 1),
(111, 'P-111', 'โทนเนอร์', 'Skin', 'Bottle', 'ML', 150, 1, 120.00, 400.00, 300.00, 1),
(112, 'P-112', 'คลีนซิ่งหน้า', 'Skin', 'Bottle', 'ML', 250, 1, 140.00, 450.00, 350.00, 1),
(113, 'P-113', 'ALOVERA GEL', 'Skin', 'Jar', 'ML', 500, 1, 150.00, 500.00, 400.00, 1),
(114, 'P-114', 'HYA GEL', 'Skin', 'Jar', 'ML', 500, 1, 250.00, 800.00, 600.00, 1),
(115, 'P-115', 'VIT E GEL', 'Skin', 'Jar', 'ML', 500, 1, 180.00, 600.00, 450.00, 1),
(116, 'P-116', 'VIT C GEL', 'Skin', 'Jar', 'ML', 500, 1, 180.00, 600.00, 450.00, 1),
(117, 'P-117', 'TRANSMIN GEL', 'Skin', 'Jar', 'ML', 500, 1, 220.00, 700.00, 550.00, 1),
(118, 'P-118', 'ACNE GEL', 'Skin', 'Jar', 'ML', 500, 1, 200.00, 650.00, 500.00, 1),
(119, 'P-119', 'AHA GEL', 'Skin', 'Jar', 'ML', 500, 1, 200.00, 650.00, 500.00, 1),
(120, 'P-120', 'BHA GEL', 'Skin', 'Jar', 'ML', 500, 1, 220.00, 700.00, 550.00, 1),
(121, 'P-121', 'IPL GEL', 'Skin', 'Jar', 'ML', 1000, 1, 100.00, 400.00, 300.00, 1),
(122, 'P-122', 'CARBON GEL', 'Skin', 'Bottle', 'ML', 100, 1, 400.00, 1500.00, 1200.00, 1),
(123, 'P-123', 'CLEANSING น้ำนม', 'Skin', 'Bottle', 'ML', 500, 1, 250.00, 800.00, 650.00, 1),
(124, 'P-124', 'GOLDEN MASK', 'Skin', 'Jar', 'Gram', 250, 0, 350.00, 1200.00, 900.00, 1),
(125, 'P-125', 'WHITE MASK', 'Skin', 'Jar', 'Gram', 250, 0, 300.00, 1000.00, 800.00, 1),
(126, 'P-126', 'ชาโคล MARK', 'Skin', 'Jar', 'Gram', 250, 0, 300.00, 1000.00, 800.00, 1),
(127, 'P-127', 'ACNOTIN 10 (แบบกิน)', 'Medicine', 'Box', 'Tab', 30, 0, 180.00, 600.00, 450.00, 1),
(128, 'P-128', 'ACNOTIN A 5%', 'Medicine', 'Tube', 'Gram', 10, 0, 100.00, 350.00, 280.00, 1),
(129, 'P-129', 'ACNOTIN A 2.5%', 'Medicine', 'Tube', 'Gram', 10, 0, 80.00, 300.00, 240.00, 1),
(130, 'P-130', 'Banzec 5%', 'Medicine', 'Tube', 'Gram', 15, 0, 150.00, 450.00, 350.00, 1),
(131, 'P-131', 'Banzec 2.5%', 'Medicine', 'Tube', 'Gram', 15, 0, 130.00, 400.00, 320.00, 1),
(132, 'P-132', 'BP 2.5', 'Medicine', 'Tube', 'Gram', 15, 0, 90.00, 300.00, 250.00, 1),
(133, 'P-133', 'T.A. 0.002%', 'Medicine', 'Jar', 'Gram', 100, 0, 120.00, 400.00, 300.00, 1),
(134, 'P-134', 'T.A. 0.1%', 'Medicine', 'Jar', 'Gram', 100, 0, 150.00, 500.00, 400.00, 1),
(135, 'P-135', 'UREA CREAM', 'Medicine', 'Jar', 'Gram', 100, 0, 100.00, 350.00, 280.00, 1),
(136, 'P-136', 'BURNOWA 70G.', 'Medicine', 'Tube', 'Gram', 70, 0, 110.00, 300.00, 250.00, 1),
(137, 'P-137', 'BURNOWA 25G.', 'Medicine', 'Tube', 'Gram', 25, 0, 50.00, 150.00, 120.00, 1),
(138, 'P-138', 'CLINDA M', 'Medicine', 'Bottle', 'ML', 15, 1, 45.00, 120.00, 100.00, 1),
(139, 'P-139', 'ACNE AID (เจลล้างหน้าแดง)', 'Skin', 'Bottle', 'ML', 100, 1, 140.00, 350.00, 280.00, 1),
(140, 'P-140', 'ACNE AID (เจลล้างหน้าฟ้า)', 'Skin', 'Bottle', 'ML', 100, 1, 140.00, 350.00, 280.00, 1),
(141, 'P-141', 'สกินนอเรน', 'Medicine', 'Tube', 'Gram', 30, 0, 250.00, 650.00, 500.00, 1),
(142, 'P-142', 'Diabe Cream 15 g.', 'Medicine', 'Tube', 'Gram', 15, 0, 80.00, 250.00, 200.00, 1),
(143, 'P-143', 'Tran Cream', 'Medicine', 'Jar', 'Gram', 30, 0, 150.00, 500.00, 400.00, 1),

-- 4. กลุ่มยากิน (Oral Medicine)
(144, 'P-144', 'PREDSOMED (แผง)', 'Medicine', 'Box', 'Strip', 10, 0, 100.00, 350.00, 280.00, 1),
(145, 'P-145', 'N.L.Doxy (แผง)', 'Medicine', 'Box', 'Strip', 10, 0, 80.00, 300.00, 240.00, 1),
(146, 'P-146', 'Bunaboct', 'Medicine', 'Box', 'Tab', 100, 0, 250.00, 800.00, 600.00, 1),
(147, 'P-147', 'Coxy Com', 'Medicine', 'Box', 'Tab', 100, 0, 300.00, 950.00, 800.00, 1),
(148, 'P-148', 'Moxi Pharm', 'Medicine', 'Box', 'Tab', 100, 0, 450.00, 1500.00, 1200.00, 1),
(149, 'P-149', 'Sensi Tic Wata', 'Medicine', 'Box', 'Tab', 100, 0, 350.00, 1100.00, 900.00, 1),
(150, 'P-150', 'AMK 1000 mg.', 'Medicine', 'Box', 'Tab', 14, 0, 180.00, 600.00, 450.00, 1),
(151, 'P-151', 'Reparil (แผง)', 'Medicine', 'Box', 'Strip', 5, 0, 120.00, 400.00, 320.00, 1),
(152, 'P-152', 'Tylenol (แผง)', 'Medicine', 'Box', 'Strip', 10, 0, 15.00, 50.00, 40.00, 1),
(153, 'P-153', 'Tramsilone', 'Medicine', 'Box', 'Tab', 100, 0, 250.00, 800.00, 650.00, 1),
(154, 'P-154', 'Diabe Denm 350', 'Medicine', 'Box', 'Tab', 100, 0, 400.00, 1200.00, 1000.00, 1),
(155, 'P-155', 'Iboprofen (แผง)', 'Medicine', 'Box', 'Strip', 10, 0, 30.00, 100.00, 80.00, 1);

-- 5. Seed inventories for all 155 products (so the entire inventory list is populated!)
-- We will seed a standard quantity of full packs (e.g., 20-50 packs) and opened sub-units (e.g. 5-30 units) for all products
INSERT INTO inventory (product_id, full_qty, opened_qty, last_updated)
SELECT product_id, 25, 5, '2026-05-30 18:00:00' FROM product;

-- 6. Seed course (Standard clinic packages)
INSERT INTO course (course_id, course_code, course_name, description, standard_price, staff_price, session_count, is_active) VALUES
(1, 'C-SUPER-AURA', 'Super Aura Skin', 'โปรแกรมเลเซอร์หน้าใสลดเลือนจุดด่างดำพร้อมมาส์กบำรุงล้ำลึก 5 ครั้ง', 15000.00, 12000.00, 5, 1),
(2, 'C-BOTOX-V', 'Botox V-Shape 100U', 'โปรแกรมลดกรามปรับรูปหน้าวีเชฟด้วย Botox Aestox 100 ยูนิต', 12000.00, 9500.00, 1, 1),
(3, 'C-FILLER-FULL', 'Filler Full Face 2cc', 'เติมเต็มร่องลึก ปรับรูปหน้าด้วย Neuramis ฟิลเลอร์ 2 ซีซี', 26000.00, 22000.00, 1, 1),
(4, 'C-ACNE-CLEAR', 'Acne Clear Premium', 'โปรแกรมรักษาสิว กดสิว ฉีดสิว มาส์กสิว ปรับสมดุลผิว 10 ครั้ง', 8000.00, 6500.00, 10, 1),
(5, 'C-MINI-AURA', 'Mini Aura Skin', 'ทรีทเมนต์บำรุงผิวหน้าขาวใสฉ่ำวาวชั่วข้ามคืน 1 ครั้ง', 3500.00, 3000.00, 1, 1);

-- 7. Seed course_item (Course Compositions)
INSERT INTO course_item (id, course_id, item_name, qty_limit) VALUES
(1, 1, 'Laser Treatment', 5),
(2, 1, 'Deep Cold Mask', 5),
(3, 2, 'Botox Injection', 1),
(4, 3, 'Filler Injection', 1),
(5, 4, 'Acne Squeezing', 10),
(6, 4, 'Acne Injection', 10),
(7, 4, 'Acne Soothing Mask', 10),
(8, 5, 'Mini Treatment', 1);

-- 8. Seed commission_rate
INSERT INTO commission_rate (id, category, item_name, course_id, fee_type, rate_amount, position_type, is_active) VALUES
(1, 'BOTOX', 'Botox Injection', 2, 'DF', 2000.00, 'Doctor', 1),
(2, 'BOTOX', 'Botox Injection Assistant', 2, 'HAND_FEE', 300.00, 'Therapist', 1),
(3, 'FILLER', 'Filler Injection', 3, 'DF', 2500.00, 'Doctor', 1),
(4, 'FILLER', 'Filler Injection Assistant', 3, 'HAND_FEE', 400.00, 'Therapist', 1),
(5, 'TREATMENT', 'Laser Treatment', 1, 'DF', 800.00, 'Doctor', 1),
(6, 'TREATMENT', 'Laser Treatment Assistant', 1, 'HAND_FEE', 150.00, 'Therapist', 1),
(7, 'TREATMENT', 'Deep Cold Mask Treatment', 1, 'HAND_FEE', 100.00, 'Therapist', 1),
(8, 'TREATMENT', 'Acne Care Treatment', 4, 'DF', 300.00, 'Doctor', 1),
(9, 'TREATMENT', 'Acne Care Treatment Assistant', 4, 'HAND_FEE', 100.00, 'Therapist', 1);

-- 9. Seed transaction_header (May 2026 sales spread over different dates for chart visualization)
INSERT INTO transaction_header (transaction_id, customer_id, staff_id, transaction_date, total_amount, discount, net_amount, remaining_balance, payment_status, channel, is_cancelled) VALUES
(1, 1, 6, '2026-05-10 10:30:00', 15000.00, 0.00, 15000.00, 0.00, 'PAID', 'WALK_IN', 0),
(2, 2, 6, '2026-05-12 14:00:00', 12000.00, 1000.00, 11000.00, 0.00, 'PAID', 'WALK_IN', 0),
(3, 3, 6, '2026-05-15 16:30:00', 26000.00, 2000.00, 24000.00, 0.00, 'PAID', 'BOOKING', 0),
(4, 4, 6, '2026-05-18 11:00:00', 8000.00, 0.00, 8000.00, 3000.00, 'PARTIAL', 'ONLINE', 0),
(5, 5, 6, '2026-05-20 15:45:00', 800.00, 50.00, 750.00, 0.00, 'PAID', 'WALK_IN', 0),
(6, 6, 6, '2026-05-22 13:00:00', 3500.00, 0.00, 3500.00, 0.00, 'PAID', 'BOOKING', 0),
(7, 7, 6, '2026-05-25 11:15:00', 15000.00, 500.00, 14500.00, 0.00, 'PAID', 'WALK_IN', 0),
(8, 8, 6, '2026-05-28 14:30:00', 12000.00, 0.00, 12000.00, 2000.00, 'PARTIAL', 'WALK_IN', 0);

-- 10. Seed transaction_item
INSERT INTO transaction_item (item_id, transaction_id, product_id, course_id, qty, unit_price, subtotal) VALUES
(1, 1, NULL, 1, 1, 15000.00, 15000.00),
(2, 2, NULL, 2, 1, 12000.00, 12000.00),
(3, 3, NULL, 3, 1, 26000.00, 26000.00),
(4, 4, NULL, 4, 1, 8000.00, 8000.00),
(5, 5, 3, NULL, 1, 800.00, 800.00),
(6, 6, NULL, 5, 1, 3500.00, 3500.00),
(7, 7, NULL, 1, 1, 15000.00, 15000.00),
(8, 8, NULL, 2, 1, 12000.00, 12000.00);

-- 11. Seed payment_log
INSERT INTO payment_log (payment_id, transaction_id, staff_id, amount_paid, payment_method, payment_date, is_cancelled) VALUES
(1, 1, 6, 15000.00, 'CASH', '2026-05-10 10:35:00', 0),
(2, 2, 6, 11000.00, 'TRANSFER', '2026-05-12 14:05:00', 0),
(3, 3, 6, 24000.00, 'CREDIT', '2026-05-15 16:35:00', 0),
(4, 4, 6, 5000.00, 'TRANSFER', '2026-05-18 11:05:00', 0),
(5, 5, 6, 750.00, 'CASH', '2026-05-20 15:50:00', 0),
(6, 6, 6, 3500.00, 'TRANSFER', '2026-05-22 13:05:00', 0),
(7, 7, 6, 14500.00, 'CREDIT', '2026-05-25 11:20:00', 0),
(8, 8, 6, 10000.00, 'CASH', '2026-05-28 14:35:00', 0);

-- 12. Seed customer_course (Active permissions)
INSERT INTO customer_course (id, customer_id, course_id, transaction_id, total_sessions, remaining_sessions, purchase_date, expiry_date, status) VALUES
(1, 1, 1, 1, 5, 3, '2026-05-10', '2027-05-10', 'ACTIVE'),
(2, 2, 2, 2, 1, 0, '2026-05-12', '2027-05-12', 'USED_UP'),
(3, 3, 3, 3, 1, 0, '2026-05-15', '2027-05-15', 'USED_UP'),
(4, 4, 4, 4, 10, 8, '2026-05-18', '2027-05-18', 'ACTIVE'),
(5, 6, 5, 6, 1, 0, '2026-05-22', '2027-05-22', 'USED_UP'),
(6, 7, 1, 7, 5, 5, '2026-05-25', '2027-05-25', 'ACTIVE'),
(7, 8, 2, 8, 1, 1, '2026-05-28', '2027-05-28', 'ACTIVE');

-- 13. Seed customer_deposit (Cash Wallet)
INSERT INTO customer_deposit (id, customer_id, transaction_id, amount, type, balance_after, note, created_at, created_by) VALUES
(1, 1, NULL, 5000.00, 'ADD', 5000.00, 'เติมเงินมัดจำล่วงหน้าสำหรับการทำทรีทเม้นท์ครั้งต่อไป', '2026-05-10 10:40:00', 6),
(2, 2, NULL, 2000.00, 'ADD', 2000.00, 'มัดจำจองโปรแกรมฟิลเลอร์', '2026-05-12 14:10:00', 6),
(3, 9, NULL, 15000.00, 'ADD', 15000.00, 'เปิดกระเป๋ามัดจำโปรแกรมทำหน้าพรีเมียม', '2026-05-14 11:30:00', 6);

-- 14. Seed service_usage (Visit logs representing treatment execution)
INSERT INTO service_usage (usage_id, service_date, customer_id, customer_course_id, transaction_id, doctor_id, therapist_id, created_by, service_name, note) VALUES
-- Customer 2 gets Botox Aestox
(1, '2026-05-12 14:30:00', 2, 2, 2, 2, 4, 1, 'Botox V-Shape 100U', 'กรามลดลง ชัดเจน ปรับโครงหน้าเรียว ฉีดโดยใช้เข็มเล็ก ไม่ช้ำ'),
-- Customer 3 gets Filler
(2, '2026-05-15 17:00:00', 3, 3, 3, 3, 5, 1, 'Filler Full Face 2cc', 'ฉีดฟิลเลอร์ Neuramis ร่องแก้มเติมเต็มรอยเหี่ยวย่น หน้าดูละมุนขึ้นทันที'),
-- Customer 1 gets 2 treatments of Super Aura Skin
(3, '2026-05-14 11:00:00', 1, 1, 1, 2, 4, 1, 'Super Aura Skin - ครั้งที่ 1', 'ทำเลเซอร์หน้าใสครั้งแรก และทำ Deep Cold Mask ปลอบประโลมผิว ผิวแดงเล็กน้อยหลังทำ'),
(4, '2026-05-28 13:00:00', 1, 1, 1, 2, 5, 1, 'Super Aura Skin - ครั้งที่ 2', 'ทำเลเซอร์หน้าใสครั้งที่ 2 และทำ Deep Cold Mask จุดด่างดำลดลง ผิวหน้าเริ่มสว่างใสขึ้น'),
-- Customer 4 gets 2 treatments of Acne Clear
(5, '2026-05-22 10:00:00', 4, 4, 4, 3, 4, 1, 'Acne Clear Premium - ครั้งที่ 1', 'กดสิวอุดตันทั่วหน้า ฉีดสิวอักเสบ 3 จุด และมาส์กโคลนสิวลดการอักเสบ'),
(6, '2026-05-29 10:00:00', 4, 4, 4, 3, 4, 1, 'Acne Clear Premium - ครั้งที่ 2', 'กดสิวอุดตันเพิ่มเติม ฉีดสิวอักเสบ 2 จุด สิวเดิมเริ่มแห้งลง รอยแดงจางลงเล็กน้อย');

-- 15. Seed fee_log (Staff Commission)
INSERT INTO fee_log (fee_id, usage_id, staff_id, fee_type, amount) VALUES
-- For Botox usage (usage_id = 1)
(1, 1, 2, 'DF', 2000.00), -- Dr. Jin gets DF
(2, 1, 4, 'HAND_FEE', 300.00), -- Ms. Anne gets Hand Fee
-- For Filler usage (usage_id = 2)
(3, 2, 3, 'DF', 2500.00), -- Dr. Pat gets DF
(4, 2, 5, 'HAND_FEE', 400.00), -- Ms. Bow gets Hand Fee
-- For Laser 1 (usage_id = 3)
(5, 3, 2, 'DF', 800.00), -- Dr. Jin
(6, 3, 4, 'HAND_FEE', 150.00), -- Ms. Anne
(7, 3, 4, 'HAND_FEE', 100.00),
-- For Laser 2 (usage_id = 4)
(8, 4, 2, 'DF', 800.00), -- Dr. Jin
(9, 4, 5, 'HAND_FEE', 150.00), -- Ms. Bow
(10, 4, 5, 'HAND_FEE', 100.00),
-- For Acne 1 (usage_id = 5)
(11, 5, 3, 'DF', 300.00), -- Dr. Pat
(12, 5, 4, 'HAND_FEE', 100.00), -- Ms. Anne
-- For Acne 2 (usage_id = 6)
(13, 6, 3, 'DF', 300.00), -- Dr. Pat
(14, 6, 4, 'HAND_FEE', 100.00); -- Ms. Anne

-- 16. Seed inventory_usage (Stock consumption logic)
INSERT INTO inventory_usage (id, usage_id, product_id, qty_used, lot_number) VALUES
-- Botox used 100 units (Aestox 100U = product_id 2)
(1, 1, 2, 100, 'L-AEST-100'),
-- Filler used 2 syringes (Neuramis Black = product_id 10)
(2, 2, 10, 2, 'L-NEU-BLK'),
-- Equipment used during visits (Syringe 3ml = product_id 83)
(3, 1, 83, 1, 'L-EQ-SYR'),
(4, 2, 83, 2, 'L-EQ-SYR'),
(5, 3, 83, 1, 'L-EQ-SYR'),
(6, 4, 83, 1, 'L-EQ-SYR'),
(7, 5, 83, 1, 'L-EQ-SYR'),
(8, 6, 83, 1, 'L-EQ-SYR'),
-- Acne cream used (Acne Cream = product_id 5)
(9, 5, 5, 1, 'L-MED-ACN'),
(10, 6, 5, 1, 'L-MED-ACN');

-- 17. Seed stock_movement (Historical logs for audit trail)
INSERT INTO stock_movement (movement_id, product_id, staff_id, action_type, qty_main, qty_sub, lot_number, expiry_date, evidence_image, note, related_transaction_id, related_usage_id, created_at) VALUES
-- Initial Stock IN
(1, 2, 1, 'IN', 50, 0, 'L-AEST-100', '2028-12-31', NULL, 'นำเข้ายา Aestox 100U ล็อตใหม่', NULL, NULL, '2026-05-01 09:00:00'),
(2, 10, 1, 'IN', 100, 0, 'L-NEU-BLK', '2028-06-30', NULL, 'นำเข้าฟิลเลอร์ Neuramis Black ปรับสมดุลสต๊อก', NULL, NULL, '2026-05-01 09:05:00'),
(3, 83, 1, 'IN', 500, 0, 'L-EQ-SYR', '2030-01-01', NULL, 'จัดเตรียมเข็มไซริงค์ 3ml', NULL, NULL, '2026-05-01 09:15:00'),
(4, 5, 1, 'IN', 200, 0, 'L-MED-ACN', '2027-08-31', NULL, 'นำเข้ายาทาสิวลดการอักเสบ', NULL, NULL, '2026-05-01 09:20:00'),
-- Usage Deductions
(5, 2, 2, 'USAGE', 0, 100, 'L-AEST-100', NULL, NULL, 'ตัดจ่ายยาจากการทำทรีทเมนต์ Botox 100U', NULL, 1, '2026-05-12 14:35:00'),
(6, 10, 3, 'USAGE', 2, 0, 'L-NEU-BLK', NULL, NULL, 'ตัดจ่ายฟิลเลอร์จากการทำหัตถการปรับรูปหน้า 2cc', NULL, 2, '2026-05-15 17:05:00'),
(7, 83, 2, 'USAGE', 1, 0, 'L-EQ-SYR', NULL, NULL, 'ไซริงค์ตัดจ่ายหัตถการ Botox', NULL, 1, '2026-05-12 14:35:00'),
(8, 83, 3, 'USAGE', 2, 0, 'L-EQ-SYR', NULL, NULL, 'ไซริงค์ตัดจ่ายหัตถการ Filler', NULL, 2, '2026-05-15 17:05:00'),
-- Manual stock adjustments (e.g. Broken syringe)
(9, 83, 1, 'ADJUST_DAMAGED', 5, 0, 'L-EQ-SYR', NULL, NULL, 'ตัดทิ้งเนื่องจากซองบรรจุชำรุดเสียหาย', NULL, NULL, '2026-05-25 10:00:00');

-- 18. Seed appointment (Upcoming and historical schedules for testing)
INSERT INTO appointment (id, customer_id, customer_course_id, appointment_date, duration_minutes, status, doctor_id, therapist_id, created_by, notes, created_at, updated_at) VALUES
-- Past successfully completed appointments
(1, 2, 2, '2026-05-12 14:00:00', 60, 'COMPLETED', 2, 4, 6, 'ทำ Botox V-Shape 100U เคสนัดหมอจินล่วงหน้า', '2026-05-05 10:00:00', '2026-05-12 15:00:00'),
(2, 3, 3, '2026-05-15 16:30:00', 60, 'COMPLETED', 3, 5, 6, 'เคสเติมฟิลเลอร์ร่องแก้ม นัดหมอพัท', '2026-05-08 11:00:00', '2026-05-15 18:00:00'),
-- Upcoming Future Appointments (to render in the "Active Appointments" panel)
(3, 1, 1, '2026-06-05 14:00:00', 45, 'SCHEDULED', 2, 4, 1, 'นัดทำทรีทเมนต์ Laser Super Aura หน้าใสครั้งที่ 3 นัดหมอจิน', '2026-05-28 14:00:00', '2026-05-28 14:00:00'),
(4, 4, 4, '2026-06-08 10:00:00', 30, 'SCHEDULED', NULL, 4, 1, 'นัดกดสิว ฉีดสิวมาส์กสิว ครั้งที่ 3 ผู้ช่วยแอนดูแล', '2026-05-29 11:00:00', '2026-05-29 11:00:00'),
(5, 5, NULL, '2026-06-10 16:00:00', 30, 'SCHEDULED', 3, NULL, 1, 'นัดเข้ามาปรึกษาการทำโปรแกรมยกกระชับใบหน้า นัดหมอพัท', '2026-05-30 09:00:00', '2026-05-30 09:00:00'),
(6, 11, NULL, '2026-06-12 11:00:00', 45, 'SCHEDULED', 2, 5, 1, 'นัดฉีดเมโสและวิตามินผิวขาวใส นัดหมอจิน ผู้ช่วยโบว์ดูแล', '2026-05-30 10:00:00', '2026-05-30 10:00:00'),
(7, 15, NULL, '2026-06-15 14:00:00', 60, 'SCHEDULED', 3, 4, 1, 'นัดจองฟิลเลอร์ Neuramis Gold ใต้ตา นัดหมอพัท', '2026-05-30 11:00:00', '2026-05-30 11:00:00');

-- 19. Seed customer_consent (PDPA Compliance logging)
INSERT INTO customer_consent (id, customer_id, consent_type, is_granted, version, consent_date, ip_address, recorded_by_staff_id) VALUES
(1, 1, 'PDPA_PRIVACY', 1, 'v1.0', '2026-05-01 10:05:00', '192.168.1.100', 1),
(2, 1, 'MARKETING', 1, 'v1.0', '2026-05-01 10:05:00', '192.168.1.100', 1),
(3, 2, 'PDPA_PRIVACY', 1, 'v1.0', '2026-05-02 11:35:00', '192.168.1.102', 1),
(4, 2, 'MARKETING', 0, 'v1.0', '2026-05-02 11:35:00', '192.168.1.102', 1),
(5, 3, 'PDPA_PRIVACY', 1, 'v1.0', '2026-05-03 14:20:00', '192.168.1.105', 1),
(6, 4, 'PDPA_PRIVACY', 1, 'v1.0', '2026-05-04 09:50:00', '192.168.1.108', 1),
(7, 5, 'PDPA_PRIVACY', 1, 'v1.0', '2026-05-05 16:25:00', '192.168.1.111', 1);

-- 20. Seed initial audit logs
INSERT INTO audit_log (id, user_id, action, target_resource, target_id, details, ip_address, user_agent, timestamp) VALUES
(1, 1, 'LOGIN_SUCCESS', 'staff', '1', 'พนักงานแอดมิน สมศักดิ์ เข้าสู่ระบบสำเร็จจากไอพีสำนักงาน', '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0', '2026-05-30 08:30:00'),
(2, 1, 'UPDATE_DEPOSIT', 'customer_deposit', '1', 'เพิ่มเงินมัดจำล่วงหน้าจำนวน 5,000.00 บาท ให้คนไข้ สมชาย ดีเลิศ', '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0', '2026-05-10 10:42:00'),
(3, 1, 'CREATE_STAFF', 'staff', '7', 'สร้างผู้ใช้ใหม่ตำแหน่งพนักงานขาย Diana Sale (sale1)', '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0', '2026-05-01 09:30:00');

COMMIT;
