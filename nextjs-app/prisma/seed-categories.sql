-- Insert initial PRODUCT categories
INSERT INTO category (type, name, code, description, sort_order, is_active) VALUES
('PRODUCT', 'โบท็อกซ์', 'Botox', 'สินค้ากลุ่มโบท็อกซ์', 1, 1),
('PRODUCT', 'ฟิลเลอร์', 'Filler', 'สินค้ากลุ่มฟิลเลอร์', 2, 1),
('PRODUCT', 'ทรีทเมนต์', 'Treatment', 'สินค้ากลุ่มทรีทเมนต์', 3, 1),
('PRODUCT', 'ยา', 'Medicine', 'สินค้ากลุ่มยา', 4, 1),
('PRODUCT', 'อุปกรณ์', 'Equipment', 'อุปกรณ์และเครื่องมือ', 5, 1),
('PRODUCT', 'สกินแคร์', 'Skin', 'สินค้ากลุ่มสกินแคร์', 6, 1);

-- Insert initial COMMISSION categories
INSERT INTO category (type, name, code, description, sort_order, is_active) VALUES
('COMMISSION', 'หมอการคลุมทรีทเมนต์', 'TREATMENT_COVER', 'ค่า DF สำหรับหมอที่คลุมทรีทเมนต์', 1, 1),
('COMMISSION', 'เลเซอร์/ทรีทเมนต์', 'LASER', 'ค่ามือสำหรับงานเลเซอร์และทรีทเมนต์', 2, 1),
('COMMISSION', 'ค่าช่วยผลักงาน', 'STAFF_ASSIST', 'ค่ามือสำหรับผู้ช่วย', 3, 1);
