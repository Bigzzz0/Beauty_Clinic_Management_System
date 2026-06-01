/**
 * beauty_clinic_db backup decryption script
 *
 * USAGE:
 *   node scripts/decrypt_backup.js <path-to-encrypted-file>
 *
 * EXAMPLE:
 *   node scripts/decrypt_backup.js backups/beauty_clinic_db-backup-2026-06-01T10-00-00.sql.gz.enc
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const filePath = process.argv[2];
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

if (!filePath) {
    console.error('[ERROR] Please specify the path to the encrypted backup file.');
    console.error('        Usage: node scripts/decrypt_backup.js <path-to-file>');
    process.exit(1);
}

if (!BACKUP_ENCRYPTION_KEY) {
    console.error('[ERROR] BACKUP_ENCRYPTION_KEY environment variable is not set.');
    console.error('        Please set it in your .env or system environment.');
    process.exit(1);
}

try {
    console.log(`[START] Decrypting ${path.basename(filePath)}...`);
    const fileBuffer = fs.readFileSync(filePath);
    
    // 1. Extract 16-byte IV from the beginning
    const iv = fileBuffer.slice(0, 16);
    const encryptedData = fileBuffer.slice(16);
    
    // 2. Derive 32-byte key using SHA-256
    const key = crypto.createHash('sha256').update(BACKUP_ENCRYPTION_KEY).digest();
    
    // 3. Decrypt
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decryptedGzipped = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    
    // 4. Gunzip compression
    const sqlData = zlib.gunzipSync(decryptedGzipped);
    
    // 5. Write to output SQL file
    const outputFilePath = filePath.replace('.gz.enc', '');
    fs.writeFileSync(outputFilePath, sqlData);
    
    console.log(`[SUCCESS] Decrypted backup file successfully!`);
    console.log(`          Output File: ${outputFilePath}`);
} catch (error) {
    console.error('[ERROR] Decryption failed! Please verify your BACKUP_ENCRYPTION_KEY and backup file.');
    console.error(error.message);
    process.exit(1);
}
