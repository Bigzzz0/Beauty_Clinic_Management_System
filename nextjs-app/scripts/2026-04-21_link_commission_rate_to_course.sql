-- Link commission rates to courses for reliable auto fee in service usage.
-- Run this once on MySQL before deploying the updated API/UI.

ALTER TABLE commission_rate
    ADD COLUMN course_id INT NULL AFTER item_name,
    ADD COLUMN fee_type ENUM('DF', 'HAND_FEE') NULL AFTER course_id;

ALTER TABLE commission_rate
    ADD INDEX idx_commission_rate_course_id (course_id),
    ADD INDEX idx_commission_rate_fee_type (fee_type),
    ADD INDEX idx_commission_rate_course_fee_active (course_id, fee_type, is_active);

ALTER TABLE commission_rate
    ADD CONSTRAINT fk_commission_rate_course
    FOREIGN KEY (course_id) REFERENCES course(course_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Optional backfill 1: map item_name to course_name when names are exactly the same.
UPDATE commission_rate cr
INNER JOIN course c ON LOWER(TRIM(cr.item_name)) = LOWER(TRIM(c.course_name))
SET cr.course_id = c.course_id
WHERE cr.course_id IS NULL;

-- Optional backfill 2: infer fee_type for old records.
UPDATE commission_rate
SET fee_type = 'HAND_FEE'
WHERE fee_type IS NULL
  AND category = 'STAFF_ASSIST';

UPDATE commission_rate
SET fee_type = 'DF'
WHERE fee_type IS NULL
  AND category <> 'STAFF_ASSIST';
