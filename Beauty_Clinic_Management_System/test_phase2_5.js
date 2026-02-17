const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'phase2_5_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPhase2_5() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Phase 2.5 Test (Enhanced Inventory)...\n');
    try {
        // 1. Login
        log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
        const token = loginRes.data.token;
        log('✅ Login Successful');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Fetch Products
        log('\n2. Fetching Products...');
        const prodRes = await axios.get(`${API_URL}/products`, config);
        const product = prodRes.data[0];
        log(`   Target Product: ${product.product_name} (ID: ${product.product_id})`);
        log(`   Initial Stock: Full=${product.full_qty}, Opened=${product.opened_qty}`);

        // 3. Test Stock In (with Lot & Exp)
        log('\n3. Testing Stock In...');
        await axios.post(`${API_URL}/stock-in`, {
            product_id: product.product_id,
            qty_main: 10,
            lot_number: 'LOT-TEST-001',
            expiry_date: '2026-12-31',
            evidence_image: '/uploads/mock_stockin.jpg',
            note: 'Automated Test Stock In',
            staff_id: 1
        }, config);
        log('✅ Stock In Successful');

        // 4. Test Stock Transfer
        log('\n4. Testing Stock Transfer...');
        await axios.post(`${API_URL}/stock-transfer`, {
            product_id: product.product_id,
            qty_main: 2,
            destination: 'Branch Test',
            evidence_image: '/uploads/mock_transfer.jpg',
            note: 'Automated Test Transfer',
            staff_id: 1
        }, config);
        log('✅ Stock Transfer Successful');

        // 5. Test Stock Adjust (Damaged)
        log('\n5. Testing Stock Adjust...');
        await axios.post(`${API_URL}/stock-adjust`, {
            product_id: product.product_id,
            qty_main: 1,
            qty_sub: 0,
            reason: 'ADJUST_DAMAGED',
            evidence_image: '/uploads/mock_adjust.jpg',
            note: 'Automated Test Adjust',
            staff_id: 1
        }, config);
        log('✅ Stock Adjust Successful');

        // 6. Verify Final Stock
        log('\n6. Verifying Final Stock...');
        const finalProdRes = await axios.get(`${API_URL}/products`, config);
        const finalProduct = finalProdRes.data.find(p => p.product_id === product.product_id);
        log(`   Final Stock: Full=${finalProduct.full_qty}, Opened=${finalProduct.opened_qty}`);

        // Expected: Initial + 10 (In) - 2 (Transfer) - 1 (Adjust) = Initial + 7
        const expected = product.full_qty + 7;
        if (finalProduct.full_qty === expected) {
            log(`✅ Stock Calculation Correct (Expected ${expected}, Got ${finalProduct.full_qty})`);
        } else {
            log(`⚠️ Stock Mismatch (Expected ${expected}, Got ${finalProduct.full_qty})`);
        }

    } catch (error) {
        log(`❌ Phase 2.5 Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPhase2_5();
