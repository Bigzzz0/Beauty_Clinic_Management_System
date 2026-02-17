const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'auth_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testAuth() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Auth Test...\n');
    try {
        log('Testing Auth API...');

        // 1. Login Failure
        log('\n1. Testing Invalid Login...');
        try {
            await axios.post(`${API_URL}/login`, { username: 'wrong', password: 'wrong' });
        } catch (error) {
            if (error.response && error.response.status === 401) {
                log('✅ Invalid login rejected correctly (401).');
            } else {
                log(`❌ Unexpected error: ${error.message}`);
            }
        }

        // 2. Login Success
        log('\n2. Testing Valid Login (dr_leo / 1234)...');
        try {
            const res = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
            log('✅ Login Successful!');
            log(`   Token: ${res.data.token ? 'Received' : 'Missing'}`);
            log(`   User: ${res.data.user.name} (${res.data.user.role})`);
        } catch (error) {
            log(`❌ Valid Login Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
        }

    } catch (error) {
        log(`❌ Auth Test Failed: ${error.message}`);
    }
}

testAuth();
