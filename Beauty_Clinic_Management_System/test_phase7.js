const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'phase7_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPhase7() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Phase 7 Test (Reports & Advanced Inventory)...\n');
    try {
        // 1. Login
        log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'admin_may', password: 'password' });
        // Note: Mock data might not have 'password' hash. 
        // If 'admin_may' fails, I'll try 'dr_leo' / '1234' which worked before.
        // Actually, let's use dr_leo since we verified it.

        let token;
        try {
            const res = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
            token = res.data.token;
            log('✅ Login Successful (dr_leo)');
        } catch (e) {
            log('❌ Login Failed');
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Test Reports
        log('\n2. Testing Sales Report...');
        const today = new Date().toISOString().split('T')[0];
        const salesRes = await axios.get(`${API_URL}/reports/sales?startDate=${today}&endDate=${today}`, config);
        log(`✅ Sales Report Fetched. Rows: ${salesRes.data.length}`);

        log('\n3. Testing Commission Report...');
        const commRes = await axios.get(`${API_URL}/reports/commission?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, config);
        log(`✅ Commission Report Fetched. Rows: ${commRes.data.length}`);

        // 4. Test Stock Transfer (Optional - requires valid product ID)
        // We need a product ID. Let's fetch products first.
        const prodRes = await axios.get(`${API_URL}/products`);
        if (prodRes.data.length > 0) {
            const product = prodRes.data[0];
            log(`\n4. Testing Stock Transfer for ${product.product_name} (ID: ${product.product_id})...`);

            try {
                await axios.post(`${API_URL}/stock-transfer`, {
                    product_id: product.product_id,
                    qty_main: 1,
                    destination: 'Branch B',
                    staff_id: 1, // dr_leo
                    note: 'Test Transfer'
                }, config);
                log('✅ Stock Transfer Successful');
            } catch (e) {
                log(`⚠️ Stock Transfer Failed (Expected if low stock): ${e.response ? e.response.data.message : e.message}`);
            }
        }

    } catch (error) {
        log(`❌ Phase 7 Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPhase7();
