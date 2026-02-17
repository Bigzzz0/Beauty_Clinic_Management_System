const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function updateSchema() {
    console.log('Updating Database Schema for Phase 11...');

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'beauty_clinic_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const connection = await pool.getConnection();

        // Add doctor_id to Transaction_Item
        try {
            await connection.query("ALTER TABLE Transaction_Item ADD COLUMN doctor_id INT NULL COMMENT 'แพทย์ผู้ทำหัตถการ (รับ DF)' AFTER subtotal_price");
            console.log('✅ Added doctor_id to Transaction_Item');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ doctor_id already exists');
            else console.error('❌ Error adding doctor_id:', e.message);
        }

        // Add therapist_id to Transaction_Item
        try {
            await connection.query("ALTER TABLE Transaction_Item ADD COLUMN therapist_id INT NULL COMMENT 'ผู้ช่วย/Therapist (รับ Hand Fee)' AFTER doctor_id");
            console.log('✅ Added therapist_id to Transaction_Item');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ therapist_id already exists');
            else console.error('❌ Error adding therapist_id:', e.message);
        }

        connection.release();
        console.log('Schema Update Completed.');
        process.exit(0);

    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

updateSchema();
