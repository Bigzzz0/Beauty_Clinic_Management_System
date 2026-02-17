const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function updateSchema() {
    console.log('Updating Database Schema for Phase 10...');

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

        // 1. Add cost_price to Product
        try {
            await connection.query("ALTER TABLE Product ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาทุนสินค้า (Cost)' AFTER staff_price");
            console.log('✅ Added cost_price to Product');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ cost_price already exists');
            else console.error('❌ Error adding cost_price:', e.message);
        }

        // 2. Add status and channel to Transaction_Header
        try {
            await connection.query("ALTER TABLE Transaction_Header ADD COLUMN status ENUM('COMPLETED', 'VOIDED') DEFAULT 'COMPLETED' COMMENT 'สถานะบิล'");
            console.log('✅ Added status to Transaction_Header');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ status already exists');
            else console.error('❌ Error adding status:', e.message);
        }

        try {
            await connection.query("ALTER TABLE Transaction_Header ADD COLUMN channel ENUM('WALK_IN', 'BOOKING', 'ONLINE') DEFAULT 'WALK_IN' COMMENT 'ช่องทางการขาย'");
            console.log('✅ Added channel to Transaction_Header');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ channel already exists');
            else console.error('❌ Error adding channel:', e.message);
        }

        // 3. Update Stock_Movement action_type and add related_transaction_id
        try {
            await connection.query("ALTER TABLE Stock_Movement MODIFY COLUMN action_type ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST_DAMAGED', 'ADJUST_EXPIRED', 'ADJUST_LOST', 'ADJUST_CLAIM') NOT NULL");
            console.log('✅ Updated action_type in Stock_Movement');
        } catch (e) {
            console.error('❌ Error updating action_type:', e.message);
        }

        try {
            await connection.query("ALTER TABLE Stock_Movement ADD COLUMN related_transaction_id INT NULL COMMENT 'อ้างอิง Transaction กรณี Claim/Void' AFTER action_type");
            console.log('✅ Added related_transaction_id to Stock_Movement');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ related_transaction_id already exists');
            else console.error('❌ Error adding related_transaction_id:', e.message);
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
