# ข้อกำหนดความต้องการของระบบ (System Requirements Specification - SRS)

**โครงการ:** ระบบบริหารจัดการคลินิกความงามครบวงจร (Beauty Clinic Management System)  
**เวอร์ชัน:** 4.0 (Updated Features: Appointments, Gallery, Debtors, PDPA)  
**วันที่อัปเดต:** 25 กุมภาพันธ์ 2026

---

## 1. ภาพรวมโครงการ (Project Overview)

### 1.1 วัตถุประสงค์ (Objectives)
พัฒนาระบบที่รองรับ **"วงจรลูกค้า (Customer Journey)"** แบบครบวงจร ตั้งแต่หน้าร้านจนถึงหลังบ้าน:
1.  **นัดหมายลูกค้า (Appointments):** จองคิวล่วงหน้า ระบุแพทย์และผู้ช่วย
2.  **ขายคอร์สและบริการ (POS & Sales):** ขายสินค้า คอร์ส รวมไปถึงระบบเงินมัดจำ (Deposit) และดูแลลูกหนี้ (Debtors)
3.  **ลูกค้ามาใช้บริการ (Service/OPD):** ทยอยใช้คอร์ส บันทึกรูปถ่าย (Patient Gallery) เพื่อดูความเปลี่ยนแปลง
4.  **ตัดสต๊อกตามจริง (Inventory):** ตัดสต๊อกยาและอุปกรณ์ตามจริงหลังจากการใช้งาน
5.  **คำนวณค่ามือ (Commission):** คำนวณค่ามือ DF (Doctor Fee) และระบุค่า Commission ประจำรอบ
6.  **ความมั่นคงปลอดภัย (Security/PDPA):** ควบคุมสิทธิ์ และมี Audit Trails ตรวจสอบได้ว่าใครทำรายการ

---

## 2. ขอบเขตผู้ใช้งาน (User Roles)

*   **Admin/Owner:** ดูภาพรวม Dashboard, กำหนดราคาคอร์ส/ยา, ดูรายงานทุกชนิด
*   **Doctor (แพทย์):** ดูประวัติ, บันทึกการรักษา, ดูตารางนัดหมายของตนเอง
*   **Therapist (ผู้ช่วยแพทย์):** ดูตารางนัด, ช่วยบันทึกการใช้บริการ
*   **Stock Staff (พนักงานคลัง):** รับสินค้า, โอนย้าย, ปรับยอด, ตัดสต๊อกจากการเบิกใช้จริง, ดูรายงานคงเหลือ
*   **Cashier/Sale (การเงิน):** ขายคอร์ส/ยา, รับชำระเงิน, ออกใบเสร็จ, จัดการระบบลูกหนี้และมัดจำ

---

## 3. รายละเอียดฟังก์ชันและตรรกะ (Functional Requirements & Logic)

### 3.1 ระบบตารางนัดหมายและเวชระเบียน (Appointments & OPD)
*   **Appointments (ตารางนัดหมาย):** ดูคิวงานรายวัน/รายเดือน แจ้งเตือนสถานะคิว (Scheduled, Completed, Cancelled, No-Show)
*   **Patient Gallery:** เก็บรูปภาพ Before/After และ Follow-up ประจำเคส เพื่อเปรียบเทียบผลลัพธ์
*   **Service Usage:** บันทึกการมาใช้บริการ 1 ครั้ง ตัดสิทธิ์คอร์สที่ซื้อไว้ และสามารถดึงประวัติการรักษาย้อนหลังได้

### 3.2 ระบบจุดขายและการเงิน (POS & Finance)
*   **POS System:** ขายปลีกและขายคอร์ส รองรับการจ่ายแบบ Split Payment (เงินสด, โอน, บัตรเครดิต, มัดจำ)
*   **Customer Deposit:** ลูกค้าสามารถเติมเงินมัดจำทิ้งไว้ในระบบ และดึงมาใช้จ่ายในบิลถัดไปได้
*   **Debtors (ระบบลูกหนี้):** บันทึกยอดค้างชำระของลูกค้า และทำการรับชำระคงค้างในภายหลัง (Partial Payment)

### 3.3 ระบบจัดการคลังสินค้า (Inventory Management)
*   **Stock Operations:** รองรับการรับเข้า (Stock-in), โอนย้ายระหว่างสาขา (Transfer), ปรับปรุงยอด (Adjustment) เลี่ยงการตัดสต๊อกอัตโนมัติหน้า POS เพื่อให้ข้อมูลตรงกับการเบิกจริง
*   **Usage Deduction:** ตัดสต๊อกตามจริงหลังจากแพทย์ทำหัตถการเสร็จ (Link กับ Service Usage)
*   **Auto-break pack:** ถ้ายาแบบขวดเปิดใช้จนหมด ระบบจะดึงจาก Full_Qty มาเปลี่ยนเป็น Opened_Qty อัตโนมัติ

### 3.4 ระบบค่าตอบแทน (Commission & DF)
*   **Trigger Point:** ค่ามือ (DF/Hand Fee) จะถูกคำนวณเมื่อมีการ "บันทึกการรักษา/ใช้สิทธิ์ (Service Usage)" สำเร็จเท่านั้น
*   **Multi-Staff:** ในการทำหัตถการ 1 ครั้ง สามารถระบุผู้ให้บริการได้หลายคน (แพทย์ได้ DF, ผู้ช่วยได้ Hand Fee)
*   **Dynamic Rates:** จัดการตั้งค่า Commission ผ่านหน้าระบบแยกอิสระ โดยอิงจาก Role และประเภทหัตถการ

### 3.5 ความปลอดภัยและ PDPA (Security & Compliance)
*   **Audit Trails:** มีการบันทึกข้อมูล `created_by` เพื่อตรวจสอบย้อนหลังได้ว่าพนักงานคนไหนกรอกข้อมูลนัดหมาย, เก็บเงิน หรือทำประวัติ
*   **Soft Delete (PDPA):** ข้อมูลลูกค้าสามารถถูกปรับสถานะ (`is_active` = false) แทนการลบแบบถาวร เพื่อไม่ให้กระทบระดับ Database / บิลเก่า
*   **Data Tracking:** ระบบบันทึกเวลาอัปเดต (`updated_at`) เสมอสำหรับตารางที่มีความสำคัญ

---

## 4. โครงสร้างข้อมูล (Data Structure Overview)

### Master Data
*   `Category`: ตารางจัดการหมวดหมู่สินค้าและคอมมิชชั่นแบบ Dynamic
*   `Product`: ข้อมูลยา/เวชภัณฑ์ (pack_size, is_liquid)
*   `Course`: ข้อมูลคอร์สหลัก พร้อมจำนวน item ย่อย
*   `Staff`: พนักงานและระดับสิทธิ์การมองเห็น
*   `Commission_Rate`: ตารางอัตราค่าตอบแทน 

### Inventory
*   `Inventory`: ยอดคงเหลือแบบ Real-time (full_qty, opened_qty)
*   `Stock_Movement`: ประวัติการเคลื่อนไหวของสต๊อกทุกประเภท (IN, OUT, USAGE, ADJUST)

### Sales & Financial
*   `Customer`: ฐานข้อมูลลูกค้า (ผูกกับ HN รูปแบบรันอัตโนมัติ)
*   `Customer_Deposit`: ระบบกระเป๋าเงินมัดจำ
*   `Transaction_Header` & `Payment_Log`: บันทึกบิลและการจ่ายเงินหลายรูปแบบ (รวมหนี้สิ่น)
*   `Customer_Course`: เก็บโควตาคอร์สที่ลูกค้ายังใช้ไม่หมด

### Service & Operations 
*   `Appointment`: ระบบจองคิว
*   `Patient_Gallery`: ไฟล์รูปภาพ Before/After ผูกกับ Customer
*   `Service_Usage`: ประวัติการใช้บริการแต่ละครั้ง
*   `Inventory_Usage`: ยาที่ถูกใช้ไปในครั้งนั้นๆ (เชื่อมไปตัดสต๊อก)
*   `Fee_Log`: ค่าตอบแทนของแพทย์/ทีมงานในรอบย่อย

---

## 5. เทคโนโลยีที่ใช้ (Tech Stack)

*   **Framework:** Next.js 16 (App Router)
*   **Frontend:** React.js, Tailwind CSS v4, shadcn/ui
*   **Backend:** Next.js API Routes (Serverless API) + Prisma ORM
*   **Database:** MySQL
*   **State Management:** Zustand, TanStack Query