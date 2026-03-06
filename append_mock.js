const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, 'mock_data.sql');

const missingSql = `
-- --------------------------------------------------------
-- 13. Service_Usage (บันทึกการเข้ารับบริการ)
-- --------------------------------------------------------
TRUNCATE TABLE service_usage;
INSERT INTO service_usage (usage_id, service_date, customer_id, customer_course_id, transaction_id, doctor_id, therapist_id, created_by, service_name, note) VALUES
(1, DATE_SUB(NOW(), INTERVAL 14 DAY), 1, NULL, 1, 1, 3, 7, 'ฉีด Botox ริ้วรอย', 'คนไข้มีย่นหน้าผากเยอะ'),
(2, DATE_SUB(NOW(), INTERVAL 13 DAY), 2, NULL, 2, 2, 4, 7, 'Botox กราม', 'ลดกราม ปรับหน้าเรียว'),
(3, DATE_SUB(NOW(), INTERVAL 12 DAY), 4, NULL, 3, 1, 5, 7, 'Filler คาง', NULL),
(4, DATE_SUB(NOW(), INTERVAL 8 DAY), 3, NULL, 5, 2, 3, 7, 'Botox Aestox ริ้วรอย', NULL),
(5, DATE_SUB(NOW(), INTERVAL 7 DAY), 8, NULL, 6, 1, 6, 7, 'Filler ปาก', 'ทรงสายฝอ'),
(6, DATE_SUB(NOW(), INTERVAL 5 DAY), 10, NULL, 7, 2, 4, 7, 'Rejuran หน้าใส 2cc', NULL),
(7, DATE_SUB(NOW(), INTERVAL 3 DAY), 5, NULL, 8, 1, 5, 7, 'ร้อยไหม Face Lift', '4 เส้น'),
(8, NOW(), 11, NULL, 11, 2, 6, 7, 'Botox Aestox ริ้วรอย', NULL),
(9, NOW(), 13, NULL, 12, 1, 3, 7, 'Filler จมูก', NULL),
(10, NOW(), 14, 13, 13, NULL, 4, 7, 'Drip ผิวขาว Premium', 'ใช้คอร์สครั้งที่ 1');

-- --------------------------------------------------------
-- 14. Inventory_Usage (การตัดสต๊อกยา/เวชภัณฑ์ตอนทำ)
-- --------------------------------------------------------
TRUNCATE TABLE inventory_usage;
INSERT INTO inventory_usage (usage_id, product_id, qty_used, lot_number) VALUES
(1, 1, 30, 'LOT-BOT-2412'),
(2, 1, 50, 'LOT-BOT-2412'),
(3, 4, 1, 'LOT-NEU-2412'),
(4, 1, 40, 'LOT-BOT-2412'),
(5, 4, 1, 'LOT-NEU-2412'),
(6, 9, 1, NULL),
(7, 11, 4, NULL),
(8, 1, 25, 'LOT-BOT-2412'),
(9, 4, 1, 'LOT-NEU-2412'),
(10, 7, 1, 'LOT-VIT-2412');

-- --------------------------------------------------------
-- 15. Fee_Log (ค่ามือ)
-- --------------------------------------------------------
TRUNCATE TABLE fee_log;
INSERT INTO fee_log (usage_id, staff_id, fee_type, amount) VALUES
(1, 1, 'DF', 500.00),
(1, 3, 'HAND_FEE', 100.00),
(2, 2, 'DF', 500.00),
(2, 4, 'HAND_FEE', 100.00),
(3, 1, 'DF', 800.00),
(3, 5, 'HAND_FEE', 150.00),
(4, 2, 'DF', 500.00),
(4, 3, 'HAND_FEE', 100.00),
(5, 1, 'DF', 800.00),
(5, 6, 'HAND_FEE', 150.00),
(6, 2, 'DF', 1000.00),
(6, 4, 'HAND_FEE', 200.00),
(7, 1, 'DF', 1500.00),
(7, 5, 'HAND_FEE', 300.00),
(8, 2, 'DF', 500.00),
(8, 6, 'HAND_FEE', 100.00),
(9, 1, 'DF', 800.00),
(9, 3, 'HAND_FEE', 150.00),
(10, 4, 'HAND_FEE', 200.00);

-- --------------------------------------------------------
-- 16. Appointment (ระบบนัดหมาย)
-- --------------------------------------------------------
TRUNCATE TABLE appointment;
INSERT INTO appointment (customer_id, appointment_date, duration_minutes, status, doctor_id, therapist_id, created_by, notes, created_at, updated_at) VALUES
(1, DATE_ADD(NOW(), INTERVAL 2 DAY), 60, 'SCHEDULED', 1, NULL, 7, 'ติดตามผล Botox', NOW(), NOW()),
(2, DATE_ADD(NOW(), INTERVAL 3 DAY), 60, 'SCHEDULED', 2, NULL, 7, 'ติดตามผลลดกราม', NOW(), NOW()),
(4, DATE_ADD(NOW(), INTERVAL 4 DAY), 60, 'SCHEDULED', 1, NULL, 7, 'ติดตามผล Filler', NOW(), NOW()),
(6, DATE_ADD(NOW(), INTERVAL 5 DAY), 60, 'SCHEDULED', NULL, 4, 7, 'นัดมา Drip วิตามิน', NOW(), NOW()),
(8, DATE_ADD(NOW(), INTERVAL 6 DAY), 60, 'SCHEDULED', 1, NULL, 7, 'ติดตามผล Filler', NOW(), NOW());

-- --------------------------------------------------------
-- 17. Customer_Deposit (ระบบมัดจำ)
-- --------------------------------------------------------
TRUNCATE TABLE customer_deposit;
INSERT INTO customer_deposit (customer_id, transaction_id, amount, type, balance_after, note, created_at, created_by) VALUES
(1, NULL, 5000.00, 'ADD', 5000.00, 'โอนเงินมัดจำล่วงหน้า', DATE_SUB(NOW(), INTERVAL 20 DAY), 7),
(1, 1, 3999.00, 'DEDUCT', 1001.00, 'หักมัดจำจ่ายค่า Botox', DATE_SUB(NOW(), INTERVAL 14 DAY), 7),
(7, NULL, 10000.00, 'ADD', 10000.00, 'มัดจำคอร์ส Rejuran', DATE_SUB(NOW(), INTERVAL 5 DAY), 7),
(7, 10, 5000.00, 'DEDUCT', 5000.00, 'จ่ายค่าคอร์สมัดจำส่วนแรก', DATE_SUB(NOW(), INTERVAL 1 DAY), 7);
`;

function run() {
    const currentContent = fs.readFileSync(targetFile, 'utf8');
    if (currentContent.includes('13. Service_Usage')) {
        console.log('SQL strings already appended.');
        return;
    }

    // Make sure we remove SET FOREIGN_KEY_CHECKS = 1; that might be at the end, 
    // append our script, and add SET FOREIGN_KEY_CHECKS = 1; back.
    let cleanedContent = currentContent;
    let hasFKChecks = false;

    if (cleanedContent.includes('SET FOREIGN_KEY_CHECKS = 1;')) {
        cleanedContent = cleanedContent.replace('SET FOREIGN_KEY_CHECKS = 1;', '');
        hasFKChecks = true;
    }

    const finalContent = cleanedContent.trim() + '\n\n' + missingSql + '\n' + (hasFKChecks ? 'SET FOREIGN_KEY_CHECKS = 1;\n' : '');

    fs.writeFileSync(targetFile, finalContent);
    console.log('Appended missing mock data correctly.');
}

run();
