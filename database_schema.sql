-- ========================================================
-- Project: Beauty Clinic Management System (v3.0 Full Logic)
-- Database: MySQL
-- Description: Updated Schema supporting Course, Redemption, Usage & Gallery
-- ========================================================

-- 1. สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS beauty_clinic_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE beauty_clinic_db;

-- ปิด Foreign Key Check ชั่วคราวเพื่อ Drop Table ได้ง่าย
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Fee_Log;
DROP TABLE IF EXISTS Payment_Log;
DROP TABLE IF EXISTS Inventory_Usage;
DROP TABLE IF EXISTS Service_Usage;
DROP TABLE IF EXISTS Customer_Course;
DROP TABLE IF EXISTS Course_Item;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS Transaction_Item;
DROP TABLE IF EXISTS Transaction_Header;
DROP TABLE IF EXISTS Stock_Movement;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Patient_Gallery;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Staff;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- ส่วนที่ 1: MASTER DATA (ข้อมูลหลัก)
-- ========================================================

-- 1.1 ตารางพนักงาน (Staff)
CREATE TABLE Staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    position ENUM('Doctor', 'Therapist', 'Admin', 'Sale', 'Cashier') NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 ตารางคนไข้ (Customer)
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    hn_code VARCHAR(20) NOT NULL UNIQUE,
    id_card_number VARCHAR(13),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
    nickname VARCHAR(50),
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    birth_date DATE,
    drug_allergy TEXT COMMENT 'Alert สีแดง',
    underlying_disease TEXT COMMENT 'โรคประจำตัว',
    member_level VARCHAR(50) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 ตารางสินค้าและยา (Product/Drug)
CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(20) UNIQUE,
    product_name VARCHAR(100) NOT NULL,
    category ENUM('Botox', 'Filler', 'Treatment', 'Medicine', 'Equipment', 'Skin') NOT NULL,
    
    -- Unit Conversion Logic
    main_unit VARCHAR(20) NOT NULL COMMENT 'หน่วยซื้อ (กล่อง/ขวด)',
    sub_unit VARCHAR(20) NOT NULL COMMENT 'หน่วยใช้ (Unit/CC/ML/เส้น)',
    pack_size INT NOT NULL DEFAULT 1 COMMENT 'ตัวคูณ (1 Main = ? Sub)',
    is_liquid BOOLEAN DEFAULT FALSE COMMENT 'ต้องตัดขวดเปิดหรือไม่?',
    
    -- Price & Cost
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    standard_price DECIMAL(10,2) DEFAULT 0.00, -- ราคาขายปลีก (ถ้าขายแยก)
    staff_price DECIMAL(10,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- 1.4 ตารางคอร์ส (Course - สินค้าที่ขายเป็นสิทธิ์) **NEW**
CREATE TABLE Course (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    standard_price DECIMAL(10,2) NOT NULL,
    staff_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

-- 1.5 รายละเอียดในคอร์ส (Course Composition) **NEW**
-- เช่น คอร์สหน้าใส = เลเซอร์ 5 ครั้ง + มาร์คหน้า 5 ครั้ง
CREATE TABLE Course_Item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL COMMENT 'ชื่อรายการบริการ (เช่น Laser, Meso)',
    qty_limit INT NOT NULL DEFAULT 1 COMMENT 'จำนวนครั้งที่ให้ในคอร์ส',
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE
);

-- ========================================================
-- ส่วนที่ 2: INVENTORY (คลังสินค้า)
-- ========================================================

CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    full_qty INT NOT NULL DEFAULT 0 COMMENT 'จำนวนกล่อง/ขวดปิด',
    opened_qty INT NOT NULL DEFAULT 0 COMMENT 'จำนวนเศษในขวดเปิด',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

CREATE TABLE Stock_Movement (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    staff_id INT NOT NULL,
    
    action_type ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST_DAMAGED', 'ADJUST_EXPIRED', 'ADJUST_CLAIM', 'ADJUST_LOST', 'USAGE', 'VOID_RETURN') NOT NULL,
    
    qty_main INT NOT NULL DEFAULT 0,
    qty_sub INT NOT NULL DEFAULT 0,
    
    lot_number VARCHAR(50),
    expiry_date DATE,
    evidence_image TEXT COMMENT 'รูปถ่ายหลักฐาน',
    note TEXT,
    
    -- Link กลับไปหาต้นเรื่อง (ถ้ามี)
    related_transaction_id INT NULL, 
    related_usage_id INT NULL COMMENT 'Link ไปใบเบิกยา (Service_Usage)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- ========================================================
-- ส่วนที่ 3: SALES (การขายเงินสด/คอร์ส)
-- ========================================================

CREATE TABLE Transaction_Header (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    staff_id INT NOT NULL COMMENT 'Cashier',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    remaining_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('PAID', 'PARTIAL', 'UNPAID', 'VOIDED') DEFAULT 'UNPAID',
    channel ENUM('WALK_IN', 'BOOKING', 'ONLINE') DEFAULT 'WALK_IN',
    
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Transaction_Item (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    
    -- ขายอะไร? (Product หรือ Course)
    product_id INT NULL,
    course_id INT NULL,
    
    qty INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES Transaction_Header(transaction_id),
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

CREATE TABLE Payment_Log (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    staff_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CASH', 'TRANSFER', 'CREDIT') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transaction_Header(transaction_id)
);

-- ========================================================
-- ส่วนที่ 4: CUSTOMER ASSETS (กระเป๋าสิทธิ์ลูกค้า) **NEW**
-- ========================================================

CREATE TABLE Customer_Course (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    course_id INT NOT NULL,
    transaction_id INT NOT NULL COMMENT 'ซื้อมาจากบิลไหน',
    
    total_sessions INT NOT NULL COMMENT 'จำนวนครั้งทั้งหมดที่ได้',
    remaining_sessions INT NOT NULL COMMENT 'จำนวนครั้งคงเหลือ',
    
    purchase_date DATE,
    expiry_date DATE NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'USED_UP') DEFAULT 'ACTIVE',
    
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id)
);

-- ========================================================
-- ส่วนที่ 5: SERVICE & USAGE (การใช้บริการ & ตัดของ) **CORE**
-- ========================================================

-- 5.1 บันทึกการมาใช้บริการ (Visit Record)
CREATE TABLE Service_Usage (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INT NOT NULL,
    
    -- ใช้สิทธิ์จากคอร์สไหน (ถ้าเป็นการใช้คอร์ส)
    usage_id INT NOT NULL,
    product_id INT NOT NULL,
    
    qty_used INT NOT NULL COMMENT 'ปริมาณที่ใช้จริง (Sub Unit)',
    lot_number VARCHAR(50) COMMENT 'ระบุ Lot ที่หยิบมาใช้ (ถ้ามี)',
    
    FOREIGN KEY (usage_id) REFERENCES Service_Usage(usage_id),
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- 5.3 บันทึกค่ามือ (Commission)
-- เชื่อมโยงกับ Service_Usage (1 เคส มีคนทำหลายคน)
CREATE TABLE Fee_Log (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    usage_id INT NOT NULL COMMENT 'เกิดจากงานไหน',
    staff_id INT NOT NULL COMMENT 'ผู้รับเงิน',
    
    fee_type ENUM('DF', 'HAND_FEE') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (usage_id) REFERENCES Service_Usage(usage_id),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

-- ========================================================
-- ส่วนที่ 6: GALLERY (รูปภาพ)
-- ========================================================

CREATE TABLE Patient_Gallery (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    usage_id INT NULL COMMENT 'เชื่อมกับ Service_Usage (ครั้งที่มาทำ)',
    
    image_type ENUM('Before', 'After', 'Follow-up', 'Document') DEFAULT 'Before',
    image_path VARCHAR(255) NOT NULL,
    taken_date DATE NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usage_id) REFERENCES Service_Usage(usage_id)
);