const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'phase8_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPhase8() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Phase 8 Test (UX/UI & Bulk Ops)...\n');
    try {
        // 1. Login
        log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
        const token = loginRes.data.token;
        log('✅ Login Successful');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Fetch Products
        const prodRes = await axios.get(`${API_URL}/products`, config);
        const p1 = prodRes.data[0];
        const p2 = prodRes.data[1];

        if (!p1 || !p2) {
            log('❌ Not enough products to test bulk operations.');
            return;
        }

        // 3. Test Bulk Stock In
        log('\n3. Testing Bulk Stock In (2 Items)...');
        await axios.post(`${API_URL}/stock-in`, {
            items: [
                { product_id: p1.product_id, qty_main: 5, lot_number: 'BULK-1', expiry_date: '2026-01-01' },
                { product_id: p2.product_id, qty_main: 5, lot_number: 'BULK-2', expiry_date: '2026-01-01' }
            ],
            supplier: 'Bulk Supplier',
            evidence_image: '/uploads/bulk_in.jpg',
            note: 'Bulk Test',
            staff_id: 1
        }, config);
        log('✅ Bulk Stock In Successful');

        // 4. Test Bulk Transfer
        log('\n4. Testing Bulk Transfer (2 Items)...');
        await axios.post(`${API_URL}/stock-transfer`, {
            items: [
                { product_id: p1.product_id, qty_main: 1 },
                { product_id: p2.product_id, qty_main: 1 }
            ],
            destination: 'Branch Bulk',
            evidence_image: '/uploads/bulk_transfer.jpg',
            note: 'Bulk Transfer Test',
            staff_id: 1
        }, config);
        log('✅ Bulk Transfer Successful');

    } catch (error) {
        log(`❌ Phase 8 Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPhase8();
