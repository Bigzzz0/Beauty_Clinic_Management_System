const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'patient_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPatient() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Patient Module Test...\n');
    try {
        // 1. Login to get token
        log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
        const token = loginRes.data.token;
        log('✅ Login Successful');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. List Patients
        log('\n2. Fetching Patient List...');
        const listRes = await axios.get(`${API_URL}/patients`, config);
        log(`✅ Found ${listRes.data.length} patients.`);

        if (listRes.data.length > 0) {
            const patient = listRes.data[0];
            log(`   Example: ${patient.full_name} (HN: ${patient.hn_code})`);

            // 3. Get Patient Detail
            log(`\n3. Fetching Detail for ID ${patient.customer_id}...`);
            const detailRes = await axios.get(`${API_URL}/patients/${patient.customer_id}`, config);
            log(`✅ Detail Fetched: ${detailRes.data.full_name}`);
            log(`   History Count: ${detailRes.data.history ? detailRes.data.history.length : 0}`);
        }

    } catch (error) {
        log(`❌ Patient Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPatient();
