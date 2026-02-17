const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function checkDatabase() {
    console.log('Checking database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'beauty_clinic_db'
        });

        console.log('✅ Database connection successful!');

        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM Product');
        console.log(`✅ Product count: ${rows[0].count}`);

        await connection.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

checkDatabase();
