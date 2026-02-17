const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'phase6_5_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPhase6_5() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Phase 6.5 Test (Enhanced Patient Module)...\n');
    try {
        // 1. Login
        log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
        const token = loginRes.data.token;
        log('✅ Login Successful');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Test Universal Search
        log('\n2. Testing Universal Search (Nickname "มล")...');
        const searchRes = await axios.get(`${API_URL}/patients?search=มล`, config);
        if (searchRes.data.length > 0) {
            log(`✅ Found ${searchRes.data.length} patients matching "มล".`);
            log(`   First match: ${searchRes.data[0].full_name} (Level: ${searchRes.data[0].member_level})`);
        } else {
            log('⚠️ No matches found for "มล" (Check mock data).');
        }

        // 3. Test Debt Calculation
        // We know from mock data that HN07491 (Customer 5) has debt.
        log('\n3. Testing Debt Calculation for Customer 5...');
        try {
            const detailRes = await axios.get(`${API_URL}/patients/5`, config);
            log(`✅ Patient: ${detailRes.data.full_name}`);
            log(`   Total Debt: ${detailRes.data.total_debt}`);

            if (Number(detailRes.data.total_debt) > 0) {
                log('✅ Debt calculation correct (Debt > 0).');
            } else {
                log('⚠️ Debt is 0 (Check transaction data).');
            }
        } catch (e) {
            log(`❌ Failed to fetch patient 5: ${e.message}`);
        }

        // 4. Test Gallery Fetch
        log('\n4. Testing Gallery Fetch for Customer 4...');
        try {
            const galleryRes = await axios.get(`${API_URL}/patients/4`, config);
            const gallery = galleryRes.data.gallery;
            log(`✅ Gallery Images: ${gallery ? gallery.length : 0}`);
            if (gallery && gallery.length > 0) {
                log(`   First Image: ${gallery[0].image_type} - ${gallery[0].image_path}`);
            }
        } catch (e) {
            log(`❌ Failed to fetch patient 4 gallery: ${e.message}`);
        }

    } catch (error) {
        log(`❌ Phase 6.5 Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPhase6_5();
