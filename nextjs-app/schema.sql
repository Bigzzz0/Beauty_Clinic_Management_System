-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `category_type_idx`(`type`),
    UNIQUE INDEX `category_type_code_key`(`type`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course` (
    `course_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_code` VARCHAR(20) NULL,
    `course_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `standard_price` DECIMAL(10, 2) NOT NULL,
    `staff_price` DECIMAL(10, 2) NULL,
    `session_count` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NULL DEFAULT true,

    UNIQUE INDEX `course_code`(`course_code`),
    PRIMARY KEY (`course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `qty_limit` INTEGER NOT NULL DEFAULT 1,

    INDEX `course_id`(`course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer` (
    `customer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `hn_code` VARCHAR(20) NOT NULL,
    `id_card_number` VARCHAR(13) NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `full_name` VARCHAR(200) NULL,
    `nickname` VARCHAR(50) NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `address` TEXT NULL,
    `birth_date` DATE NULL,
    `drug_allergy` TEXT NULL,
    `underlying_disease` TEXT NULL,
    `member_level` VARCHAR(50) NULL DEFAULT 'General',
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `hn_code`(`hn_code`),
    INDEX `customer_first_name_last_name_phone_number_hn_code_idx`(`first_name`, `last_name`, `phone_number`, `hn_code`),
    INDEX `customer_phone_number_idx`(`phone_number`),
    INDEX `customer_hn_code_idx`(`hn_code`),
    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `course_id` INTEGER NOT NULL,
    `transaction_id` INTEGER NOT NULL,
    `total_sessions` INTEGER NOT NULL,
    `remaining_sessions` INTEGER NOT NULL,
    `purchase_date` DATE NULL,
    `expiry_date` DATE NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'USED_UP') NULL DEFAULT 'ACTIVE',

    INDEX `course_id`(`course_id`),
    INDEX `customer_id`(`customer_id`),
    INDEX `customer_course_transaction_id_idx`(`transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_log` (
    `fee_id` INTEGER NOT NULL AUTO_INCREMENT,
    `usage_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `fee_type` ENUM('DF', 'HAND_FEE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,

    INDEX `staff_id`(`staff_id`),
    INDEX `usage_id`(`usage_id`),
    PRIMARY KEY (`fee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `inventory_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `full_qty` INTEGER NOT NULL DEFAULT 0,
    `opened_qty` INTEGER NOT NULL DEFAULT 0,
    `last_updated` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `product_id`(`product_id`),
    PRIMARY KEY (`inventory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_usage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usage_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `qty_used` INTEGER NOT NULL,
    `lot_number` VARCHAR(50) NULL,

    INDEX `product_id`(`product_id`),
    INDEX `usage_id`(`usage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_gallery` (
    `gallery_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `usage_id` INTEGER NULL,
    `image_type` ENUM('Before', 'After', 'Follow-up', 'Document') NULL DEFAULT 'Before',
    `image_path` VARCHAR(255) NOT NULL,
    `taken_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `usage_id`(`usage_id`),
    INDEX `patient_gallery_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`gallery_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_log` (
    `payment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL,
    `payment_method` ENUM('CASH', 'TRANSFER', 'CREDIT', 'DEPOSIT') NOT NULL,
    `payment_date` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `transaction_id`(`transaction_id`),
    INDEX `payment_log_staff_id_idx`(`staff_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `product_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_code` VARCHAR(20) NULL,
    `product_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `main_unit` VARCHAR(20) NOT NULL,
    `sub_unit` VARCHAR(20) NOT NULL,
    `pack_size` INTEGER NOT NULL DEFAULT 1,
    `is_liquid` BOOLEAN NULL DEFAULT false,
    `cost_price` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `standard_price` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `staff_price` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `is_active` BOOLEAN NULL DEFAULT true,

    UNIQUE INDEX `product_code`(`product_code`),
    INDEX `product_category_idx`(`category`),
    PRIMARY KEY (`product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_usage` (
    `usage_id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_date` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `customer_id` INTEGER NOT NULL,
    `customer_course_id` INTEGER NULL,
    `transaction_id` INTEGER NULL,
    `doctor_id` INTEGER NULL,
    `therapist_id` INTEGER NULL,
    `created_by` INTEGER NULL,
    `service_name` VARCHAR(100) NOT NULL,
    `note` TEXT NULL,

    INDEX `customer_id`(`customer_id`),
    INDEX `customer_course_id`(`customer_course_id`),
    INDEX `service_usage_service_date_idx`(`service_date`),
    INDEX `service_usage_transaction_id_idx`(`transaction_id`),
    INDEX `service_usage_doctor_id_idx`(`doctor_id`),
    INDEX `service_usage_therapist_id_idx`(`therapist_id`),
    INDEX `service_usage_created_by_idx`(`created_by`),
    PRIMARY KEY (`usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `staff_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `position` ENUM('Doctor', 'Therapist', 'Admin', 'Sale', 'Cashier') NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `username`(`username`),
    PRIMARY KEY (`staff_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movement` (
    `movement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `action_type` ENUM('IN', 'OUT', 'TRANSFER', 'MANUAL_OUT', 'ADJUST_DAMAGED', 'ADJUST_EXPIRED', 'ADJUST_CLAIM', 'ADJUST_LOST', 'USAGE', 'VOID_RETURN') NOT NULL,
    `qty_main` INTEGER NOT NULL DEFAULT 0,
    `qty_sub` INTEGER NOT NULL DEFAULT 0,
    `lot_number` VARCHAR(50) NULL,
    `expiry_date` DATE NULL,
    `evidence_image` LONGTEXT NULL,
    `note` TEXT NULL,
    `related_transaction_id` INTEGER NULL,
    `related_usage_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `product_id`(`product_id`),
    INDEX `stock_movement_created_at_idx`(`created_at`),
    INDEX `stock_movement_staff_id_idx`(`staff_id`),
    INDEX `stock_movement_related_transaction_id_idx`(`related_transaction_id`),
    INDEX `stock_movement_related_usage_id_idx`(`related_usage_id`),
    PRIMARY KEY (`movement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_header` (
    `transaction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `transaction_date` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `net_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `remaining_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_status` ENUM('PAID', 'PARTIAL', 'UNPAID', 'VOIDED') NULL DEFAULT 'UNPAID',
    `channel` ENUM('WALK_IN', 'BOOKING', 'ONLINE') NULL DEFAULT 'WALK_IN',
    `updated_at` DATETIME(3) NULL,

    INDEX `customer_id`(`customer_id`),
    INDEX `transaction_header_transaction_date_idx`(`transaction_date`),
    INDEX `transaction_header_staff_id_idx`(`staff_id`),
    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_item` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `course_id` INTEGER NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    INDEX `course_id`(`course_id`),
    INDEX `product_id`(`product_id`),
    INDEX `transaction_id`(`transaction_id`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_rate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(50) NOT NULL,
    `item_name` VARCHAR(100) NOT NULL,
    `rate_amount` DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
    `position_type` ENUM('Doctor', 'Therapist', 'Admin', 'Sale', 'Cashier') NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NULL,

    INDEX `commission_rate_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_deposit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `transaction_id` INTEGER NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `type` ENUM('ADD', 'DEDUCT', 'REFUND', 'ADJUST') NOT NULL,
    `balance_after` DECIMAL(10, 2) NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` INTEGER NULL,

    INDEX `customer_deposit_customer_id`(`customer_id`),
    INDEX `customer_deposit_transaction_id`(`transaction_id`),
    INDEX `customer_deposit_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `customer_course_id` INTEGER NULL,
    `appointment_date` DATETIME(0) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 60,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
    `doctor_id` INTEGER NULL,
    `therapist_id` INTEGER NULL,
    `created_by` INTEGER NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `appointment_customer_id_idx`(`customer_id`),
    INDEX `appointment_appointment_date_idx`(`appointment_date`),
    INDEX `appointment_doctor_id_idx`(`doctor_id`),
    INDEX `appointment_therapist_id_idx`(`therapist_id`),
    INDEX `appointment_created_by_idx`(`created_by`),
    INDEX `appointment_customer_course_id_idx`(`customer_course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_item` ADD CONSTRAINT `fk_course_item_belongs_to_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customer_course` ADD CONSTRAINT `fk_purchased_course_belongs_to_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customer_course` ADD CONSTRAINT `fk_purchased_course_is_of_course_type` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customer_course` ADD CONSTRAINT `fk_purchased_course_billed_in_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_header`(`transaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `fee_log` ADD CONSTRAINT `fk_fee_earned_from_service_usage` FOREIGN KEY (`usage_id`) REFERENCES `service_usage`(`usage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `fee_log` ADD CONSTRAINT `fk_fee_earned_by_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `fk_inventory_tracks_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`product_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_usage` ADD CONSTRAINT `fk_inventory_used_during_service` FOREIGN KEY (`usage_id`) REFERENCES `service_usage`(`usage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `inventory_usage` ADD CONSTRAINT `fk_inventory_usage_deducts_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`product_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patient_gallery` ADD CONSTRAINT `fk_gallery_photo_taken_during_service` FOREIGN KEY (`usage_id`) REFERENCES `service_usage`(`usage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patient_gallery` ADD CONSTRAINT `fk_gallery_photo_belongs_to_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_log` ADD CONSTRAINT `fk_payment_applied_to_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_header`(`transaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_log` ADD CONSTRAINT `fk_payment_received_by_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `service_usage` ADD CONSTRAINT `fk_service_used_by_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `service_usage` ADD CONSTRAINT `fk_service_deducts_from_purchased_course` FOREIGN KEY (`customer_course_id`) REFERENCES `customer_course`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `service_usage` ADD CONSTRAINT `fk_service_billed_in_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_header`(`transaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `service_usage` ADD CONSTRAINT `fk_service_performed_by_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `service_usage` ADD CONSTRAINT `fk_service_performed_by_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `service_usage` ADD CONSTRAINT `fk_service_record_created_by_staff` FOREIGN KEY (`created_by`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_movement` ADD CONSTRAINT `fk_stock_movement_updates_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`product_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_movement` ADD CONSTRAINT `fk_stock_movement_recorded_by_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_movement` ADD CONSTRAINT `fk_stock_movement_linked_to_transaction` FOREIGN KEY (`related_transaction_id`) REFERENCES `transaction_header`(`transaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_movement` ADD CONSTRAINT `fk_stock_movement_linked_to_service_usage` FOREIGN KEY (`related_usage_id`) REFERENCES `service_usage`(`usage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transaction_header` ADD CONSTRAINT `fk_transaction_billed_to_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transaction_header` ADD CONSTRAINT `fk_transaction_created_by_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transaction_item` ADD CONSTRAINT `fk_transaction_item_belongs_to_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_header`(`transaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transaction_item` ADD CONSTRAINT `fk_transaction_item_sells_product` FOREIGN KEY (`product_id`) REFERENCES `product`(`product_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transaction_item` ADD CONSTRAINT `fk_transaction_item_sells_course` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customer_deposit` ADD CONSTRAINT `fk_deposit_belongs_to_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customer_deposit` ADD CONSTRAINT `fk_deposit_used_in_or_from_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_header`(`transaction_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `customer_deposit` ADD CONSTRAINT `fk_deposit_record_created_by_staff` FOREIGN KEY (`created_by`) REFERENCES `staff`(`staff_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `fk_appointment_booked_by_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `fk_appointment_uses_purchased_course` FOREIGN KEY (`customer_course_id`) REFERENCES `customer_course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `fk_appointment_requested_with_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `fk_appointment_requested_with_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `fk_appointment_recorded_by_staff` FOREIGN KEY (`created_by`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE;

