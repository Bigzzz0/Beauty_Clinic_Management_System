-- Beauty Clinic Management System
-- Principle of Least Privilege Database Setup
-- 
-- 1. Run this script as the root database user 
-- 2. Update your .env DATABASE_URL to use the 'clinic_app' user instead of root.

-- Step 1: Create the limited application user (Change 'SecureAppPassword123!' in production)
CREATE USER IF NOT EXISTS 'clinic_app'@'%' IDENTIFIED BY 'SecureAppPassword123!';

-- Step 2: Revoke any existing potentially dangerous global privileges
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'clinic_app'@'%';

-- Step 3: Grant only essential DML (Data Manipulation Language) privileges to the application database.
-- NOTE: Replace `beauty_clinic_db` with your actual database name if different.
GRANT SELECT, INSERT, UPDATE, DELETE ON beauty_clinic_db.* TO 'clinic_app'@'%';

-- Note: We are deliberatively NOT granting DROP, ALTER, CREATE, TRUNCATE, or GRANT OPTION.
-- Migrations (`prisma migrate`) should be run by a separate admin user, not the runtime application.

-- Apply changes
FLUSH PRIVILEGES;
