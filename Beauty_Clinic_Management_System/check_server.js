const mysql = require('mysql2/promise');
const http = require('http');

async function checkDB() {
    console.log('Checking Database Connection...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '14717000big',
            database: 'beauty_clinic_db'
        });
        console.log('✅ Database Connection Successful');
        await connection.end();
    } catch (error) {
        console.error('❌ Database Connection Failed:', error.message);
    }
}

function checkServer() {
    console.log('Checking Server Reachability (http://localhost:5000)...');
    http.get('http://localhost:5000/', (res) => {
        console.log(`✅ Server Reachable (Status: ${res.statusCode})`);
        res.on('data', () => { }); // Consume data
    }).on('error', (err) => {
        console.error('❌ Server Unreachable:', err.message);
    });
}

async function run() {
    await checkDB();
    checkServer();
}

run();
