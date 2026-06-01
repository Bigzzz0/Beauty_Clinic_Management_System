/**
 * beauty_clinic_db backup script
 *
 * USAGE:
 *   node scripts/backup_db.js
 *
 * SCHEDULING (Windows Task Scheduler — ทุกเที่ยงคืน):
 *   1. เปิด Task Scheduler > Create Basic Task
 *   2. Trigger: Daily at 00:00
 *   3. Action: Start a program
 *      Program: node
 *      Arguments: "C:\path\to\Beauty_Clinic_Management_System\nextjs-app\scripts\backup_db.js"
 *
 * SCHEDULING (Unix cron — ทุกเที่ยงคืน):
 *   0 0 * * * node /path/to/nextjs-app/scripts/backup_db.js >> /var/log/clinic-backup.log 2>&1
 *
 * ENVIRONMENT VARIABLES (ตั้งค่าใน .env หรือ System Environment):
 *   DB_BACKUP_USER     - MySQL username (default: root)
 *   DB_BACKUP_PASSWORD - MySQL password (required — do NOT hardcode!)
 *   DB_NAME            - Database name (default: beauty_clinic_db)
 *   DB_PORT            - MySQL port (default: 3306)
 *   DB_HOST            - MySQL host (default: 127.0.0.1)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

const DB_USER = process.env.DB_BACKUP_USER || 'root';
const DB_PASSWORD = process.env.DB_BACKUP_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'beauty_clinic_db';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

if (!DB_PASSWORD) {
    console.error('[ERROR] DB_BACKUP_PASSWORD environment variable is not set. Aborting backup.');
    console.error('        Set it in your .env file or system environment variables.');
    process.exit(1);
}

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 14; // Keep backups for 14 days

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `${DB_NAME}-backup-${timestamp}.sql`);

    console.log(`[${new Date().toLocaleString('th-TH')}] Starting backup...`);
    console.log(`  📁 Temporary / Raw SQL Output: ${backupFile}`);

    const dumpCmd = process.platform === 'win32'
        ? `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} --port=${DB_PORT} --single-transaction --routines --triggers ${DB_NAME} > "${backupFile}"`
        : `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} --port=${DB_PORT} --single-transaction --routines --triggers ${DB_NAME} > '${backupFile}'`;

    try {
        execSync(dumpCmd, { stdio: ['ignore', 'pipe', 'pipe'] });

        let finalFile = backupFile;
        let succeeded = false;

        if (fs.existsSync(backupFile) && fs.statSync(backupFile).size > 0) {
            succeeded = true;
        }

        if (succeeded) {
            if (BACKUP_ENCRYPTION_KEY) {
                console.log('  🔒 Encrypting & compressing backup...');
                const sqlData = fs.readFileSync(backupFile);
                
                // 1. Gzip compression
                const gzipped = zlib.gzipSync(sqlData);
                
                // 2. Derive 32-byte key using SHA-256 for maximum robustness
                const key = crypto.createHash('sha256').update(BACKUP_ENCRYPTION_KEY).digest();
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                
                const encrypted = Buffer.concat([cipher.update(gzipped), cipher.final()]);
                const outputBuffer = Buffer.concat([iv, encrypted]);
                
                finalFile = `${backupFile}.gz.enc`;
                fs.writeFileSync(finalFile, outputBuffer);
                
                // Delete raw SQL file for security
                fs.unlinkSync(backupFile);
                console.log(`  ✅ Encrypted backup successful! File: ${path.basename(finalFile)}`);
            } else {
                console.log(`  ✅ Plain-text SQL backup successful!`);
            }

            const stats = fs.statSync(finalFile);
            const fileSizeKB = (stats.size / 1024).toFixed(1);
            console.log(`  ✅ File size: ${fileSizeKB} KB`);
            cleanOldBackups();
        } else {
            console.error('  ❌ Backup failed: Empty backup file created.');
            process.exit(1);
        }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        // Filter out the common "password on command line" warning
        if (!errMsg.includes('Using a password on the command line') && errMsg.trim()) {
            console.error(`  ❌ Backup failed: ${errMsg}`);
            process.exit(1);
        }
        
        // If only the password warning appeared, backup likely succeeded
        if (fs.existsSync(backupFile) && fs.statSync(backupFile).size > 0) {
            let finalFile = backupFile;
            if (BACKUP_ENCRYPTION_KEY) {
                console.log('  🔒 Encrypting & compressing backup (ignoring mysqldump password warning)...');
                const sqlData = fs.readFileSync(backupFile);
                const gzipped = zlib.gzipSync(sqlData);
                const key = crypto.createHash('sha256').update(BACKUP_ENCRYPTION_KEY).digest();
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                const encrypted = Buffer.concat([cipher.update(gzipped), cipher.final()]);
                const outputBuffer = Buffer.concat([iv, encrypted]);
                
                finalFile = `${backupFile}.gz.enc`;
                fs.writeFileSync(finalFile, outputBuffer);
                fs.unlinkSync(backupFile);
                console.log(`  ✅ Encrypted backup completed (with mysqldump warning — safe to ignore)`);
            } else {
                console.log('  ✅ Backup completed (with mysqldump password warning — safe to ignore)');
            }
            const stats = fs.statSync(finalFile);
            const fileSizeKB = (stats.size / 1024).toFixed(1);
            console.log(`  ✅ File size: ${fileSizeKB} KB`);
            cleanOldBackups();
        } else {
            console.error(`  ❌ Backup failed: ${errMsg}`);
            process.exit(1);
        }
    }
}

function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files
            .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz.enc'))
            .map(f => path.join(BACKUP_DIR, f))
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

        if (backups.length > MAX_BACKUPS) {
            const toDelete = backups.slice(MAX_BACKUPS);
            toDelete.forEach(file => {
                fs.unlinkSync(file);
                console.log(`  🗑️  Deleted old backup: ${path.basename(file)}`);
            });
        }

        console.log(`  📊 Total backups stored: ${Math.min(backups.length, MAX_BACKUPS)}/${MAX_BACKUPS}`);
    } catch (err) {
        console.error('  ⚠️  Could not clean old backups:', err instanceof Error ? err.message : err);
    }
}

// Run
runBackup();

