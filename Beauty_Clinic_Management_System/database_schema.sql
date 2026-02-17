-- ========================================================
-- Project: Beauty Clinic Management System
-- Database: MySQL Community Edition
-- Description: สคริปต์สร้างฐานข้อมูลและตารางทั้งหมดตาม SRS
-- ========================================================

-- 1. สร้างฐานข้อมูลและกำหนด Encoding ให้รองรับภาษาไทย
CREATE DATABASE IF NOT EXISTS beauty_clinic_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE beauty_clinic_db;

-- ========================================================
-- ส่วนที่ 1: MASTER DATA (ข้อมูลหลัก)
-- ========================================================

-- 1.1 ตารางพนักงาน (Staff)
-- ต้องสร้างก่อนเพราะถูกอ้างอิงโดยตารางอื่น (เช่น ใครเป็นคนรับของ, ใครขาย)
CREATE TABLE Staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL COMMENT 'ชื่อ-นามสกุล',
    position ENUM('Doctor', 'Therapist', 'Admin', 'Sale', 'Cashier') NOT NULL COMMENT 'ตำแหน่งงาน',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'ชื่อเข้าระบบ',
    password_hash VARCHAR(255) NOT NULL COMMENT 'รหัสผ่าน (เก็บแบบ Hash)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะ (1=ปกติ, 0=ลาออก)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 ตารางคนไข้ (Customer)
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- ข้อมูลระบุตัวตน
    hn_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'รหัส HN จาก Excel (เช่น 00001)',
    id_card_number VARCHAR(13) COMMENT 'เลขบัตรประชาชน',
    
    -- ข้อมูลส่วนตัว
    first_name VARCHAR(100) NOT NULL COMMENT 'ชื่อจริง',
    last_name VARCHAR(100) NOT NULL COMMENT 'นามสกุล',
    full_name VARCHAR(200) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
    nickname VARCHAR(50) COMMENT 'ชื่อเล่น',
    
    -- ข้อมูลติดต่อ
    phone_number VARCHAR(20) NOT NULL COMMENT 'เบอร์โทรศัพท์',
    address TEXT COMMENT 'ที่อยู่',
    
    -- ข้อมูลทางการแพทย์
    birth_date DATE COMMENT 'วันเดือนปีเกิด',
    drug_allergy TEXT COMMENT 'ประวัติแพ้ยา (Alert สีแดง)',
    underlying_disease TEXT COMMENT 'โรคประจำตัว',
    
    -- ข้อมูลการตลาด/สมาชิก (รองรับ Platinum, Platinum Gold, Gold, General)
    personal_consult VARCHAR(100) COMMENT 'ชื่อที่ปรึกษาส่วนตัว (Sales Team)',
    member_level VARCHAR(50) DEFAULT 'General' COMMENT 'ระดับสมาชิก: Platinum, Platinum Gold, Gold, General',
    
    -- ข้อมูลระบบ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 1.3 ตารางสินค้าและบริการ (Product)
CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(20) UNIQUE COMMENT 'รหัสสินค้า/SKU',
    product_name VARCHAR(100) NOT NULL,
    category ENUM('Botox', 'Filler', 'Treatment', 'Medicine', 'Equipment') NOT NULL,
    
    -- การจัดการหน่วยนับ (Unit Conversion)
-- ========================================================

-- 2.1 ตารางสต๊อกคงเหลือปัจจุบัน (Real-time Inventory)
CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    full_qty INT NOT NULL DEFAULT 0 COMMENT 'จำนวนของยังไม่เปิด (นับตาม main_unit)',
    opened_qty INT NOT NULL DEFAULT 0 COMMENT 'จำนวนเศษในขวดเปิด (นับตาม sub_unit)',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
    evidence_image TEXT COMMENT 'URL/Path รูปถ่ายหลักฐาน',
    note TEXT COMMENT 'หมายเหตุ (เช่น ของแตก, รับของเข้า)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

-- ========================================================
-- ส่วนที่ 3: SALES & FINANCE (การขายและการเงิน)
-- ========================================================

-- 3.1 หัวบิลการขาย (Transaction Header)
CREATE TABLE Transaction_Header (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    staff_id INT NOT NULL COMMENT 'พนักงานเปิดบิล (Cashier)',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    staff_id INT NOT NULL COMMENT 'คนรับเงิน',
    
    amount_paid DECIMAL(10,2) NOT NULL COMMENT 'ยอดที่จ่ายครั้งนี้',
    payment_method ENUM('CASH', 'TRANSFER', 'CREDIT') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES Transaction_Header(transaction_id),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

-- 3.4 ค่าตอบแทนแพทย์/ผู้ช่วย (Fee/Commission Log)
CREATE TABLE Fee_Log (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    staff_id INT NOT NULL COMMENT 'ผู้รับเงิน (หมอ/ผู้ช่วย)',
    
    fee_type ENUM('DF', 'HAND_FEE') NOT NULL COMMENT 'DF=ค่าแพทย์, HAND_FEE=ค่ามือผู้ช่วย',
    amount DECIMAL(10,2) NOT NULL COMMENT 'จำนวนเงินที่ได้',
    
    FOREIGN KEY (transaction_id) REFERENCES Transaction_Header(transaction_id),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

-- ========================================================
-- เพิ่มตาราง Patient_Gallery และปรับปรุงตารางอื่นๆ
-- ========================================================

-- 1. ตารางเก็บรูปภาพคนไข้ (Before/After/History)
CREATE TABLE Patient_Gallery (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    transaction_id INT NULL COMMENT 'เชื่อมกับบิลการรักษา (ถ้ามี)',
    
    image_type ENUM('Before', 'After', 'Follow-up', 'Document', 'Other') NOT NULL DEFAULT 'Before',
    image_path VARCHAR(255) NOT NULL COMMENT 'URL หรือ Path ไฟล์รูปภาพ',
    taken_date DATE NOT NULL COMMENT 'วันที่ถ่ายรูป',
    notes TEXT COMMENT 'บันทึกเพิ่มเติม (เช่น มุมหน้า, แสง)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES Transaction_Header(transaction_id) ON DELETE SET NULL
);

-- หมายเหตุ: สำหรับรูปภาพ Stock (Stock In, Transfer, Adjustment) 
-- เราใช้ฟิลด์ 'evidence_image' ในตาราง Stock_Movement ที่มีอยู่แล้วได้เลย
-- ไม่จำเป็นต้องสร้างตารางแยก เพราะ 1 รายการมักมีรูปหลักฐานแค่ 1-2 รูป

-- ========================================================
-- Schema Migration for Phase 10: Advanced Reports & Transaction Management
-- Description: Adds columns for profit calculation, transaction status, and stock adjustment linking.
-- ========================================================



-- 1. Update Product Table
-- Add cost_price for profit calculation
ALTER TABLE Product
ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาทุน (เพื่อคำนวณกำไร)' AFTER standard_price;

-- 2. Update Transaction_Header Table
-- Add status and channel columns
ALTER TABLE Transaction_Header
ADD COLUMN status ENUM('COMPLETED', 'VOIDED') NOT NULL DEFAULT 'COMPLETED' COMMENT 'สถานะบิล' AFTER payment_status,
ADD COLUMN channel ENUM('WALK_IN', 'BOOKING', 'ONLINE') NOT NULL DEFAULT 'WALK_IN' COMMENT 'ช่องทางขาย' AFTER status;

-- 3. Update Stock_Movement Table
-- Add related_transaction_id and update action_type enum
-- Note: Modifying ENUM column usually requires redefining all values
ALTER TABLE Stock_Movement
ADD COLUMN related_transaction_id INT NULL COMMENT 'เชื่อมโยงกับ Transaction (กรณี Void/Claim)' AFTER staff_id,
ADD CONSTRAINT fk_movement_transaction FOREIGN KEY (related_transaction_id) REFERENCES Transaction_Header(transaction_id) ON DELETE SET NULL;

-- Modify action_type to include new types (ADJUST_CLAIM, ADJUST_LOST)
-- Important: Include all previous values + new ones
ALTER TABLE Stock_Movement
MODIFY COLUMN action_type ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST_DAMAGED', 'ADJUST_EXPIRED', 'ADJUST_CLAIM', 'ADJUST_LOST', 'SALE', 'VOID_RETURN') NOT NULL COMMENT 'ประเภทการเคลื่อนไหว';

-- ========================================================
-- Optional: Update existing data (Data Migration)
-- ========================================================

-- Example: Update cost_price for existing products (Set to 50% of standard price as placeholder)
UPDATE Product SET cost_price = standard_price * 0.5 WHERE cost_price = 0;

-- Example: Set channel for existing transactions to WALK_IN
UPDATE Transaction_Header SET channel = 'WALK_IN' WHERE channel IS NULL;