const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// IMPORTANT: This should be configured via environment variables for security.
// Ensure you do not hardcode passwords in production.
const DB_USER = process.env.DB_BACKUP_USER || 'root';
const DB_PASSWORD = process.env.DB_BACKUP_PASSWORD || 'your_root_password';
const DB_NAME = process.env.DB_NAME || 'beauty_clinic_db';
const DB_PORT = process.env.DB_PORT || '3306';

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 14; // Keep backups for 14 days

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `${DB_NAME}-backup-${timestamp}.sql`);

    // Using mysqldump command
    const dumpCmd = `mysqldump -u ${DB_USER} -p${DB_PASSWORD} --port=${DB_PORT} ${DB_NAME} > "${backupFile}"`;

    console.log(`Starting database backup: ${backupFile}`);

    exec(dumpCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup failed. Error: ${error.message}`);
            return;
        }
        if (stderr && !stderr.includes('Warning: Using a password on the command line interface can be insecure')) {
            // Notice: mysqldump outputs warnings to stderr. We ignore the typical password warning.
            console.warn(`Backup warnings: ${stderr}`);
        }
        console.log(`Backup completed successfully: ${backupFile}`);
        cleanOldBackups();
    });
}

function cleanOldBackups() {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) {
            console.error('Could not list backup directory:', err);
            return;
        }

        const backups = files
            .filter(f => f.endsWith('.sql'))
            .map(f => path.join(BACKUP_DIR, f))
            .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

        // Delete old backups
        if (backups.length > MAX_BACKUPS) {
            const toDelete = backups.slice(MAX_BACKUPS);
            toDelete.forEach(file => {
                fs.unlink(file, err => {
                    if (err) console.error(`Failed to delete old backup: ${file}`, err);
                    else console.log(`Deleted old backup: ${file}`);
                });
            });
        }
    });
}

// Execute the backup
runBackup();
