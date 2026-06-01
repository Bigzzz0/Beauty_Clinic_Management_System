-- Add token invalidation and forced password-change columns for staff authentication hardening
ALTER TABLE `staff`
  ADD COLUMN `token_version` INT NOT NULL DEFAULT 0 AFTER `password_hash`,
  ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0 AFTER `token_version`;

-- Optional: force selected accounts to change password on next login
-- UPDATE `staff` SET `must_change_password` = 1 WHERE `staff_id` IN (/* ids */);
