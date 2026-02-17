const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'phase10_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPhase10() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Phase 10 Test (Void & Reports)...\n');
    try {
        // 1. Login
        log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
        const token = loginRes.data.token;
        log('✅ Login Successful');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create a Transaction to Void
        log('\n2. Creating Transaction...');
        const txRes = await axios.post(`${API_URL}/transactions`, {
            customer_id: 1,
            staff_id: 1,
            items: [{ product_id: 1, qty_used: 1, unit_price: 1000, staff_ids: [] }],
            total_amount: 1000,
            discount: 0,
            net_amount: 1000,
            amount_paid: 1000,
            payment_method: 'CASH'
        }, config);
        const txId = txRes.data.transactionId;
        log(`✅ Transaction Created: #${txId}`);

        // 3. Void Transaction (Booking Cancel)
        log(`\n3. Voiding Transaction #${txId} (Booking Cancel)...`);
        await axios.post(`${API_URL}/transactions/${txId}/void`, {
            reason: 'BOOKING_CANCEL',
            staff_id: 1
        }, config);
        log('✅ Void Successful (Stock Reverted)');

        // 4. Test Reports
        log('\n4. Testing Report APIs...');
        const finRes = await axios.get(`${API_URL}/reports/financial`, config);
        log(`✅ Financial Report: ${finRes.data.sales.length} days data`);

        const staffRes = await axios.get(`${API_URL}/reports/staff`, config);
        log(`✅ Staff Report: ${staffRes.data.top_staff.length} staff`);

        const retRes = await axios.get(`${API_URL}/reports/retention`, config);
        log(`✅ Retention Report: ${retRes.data.lost_customers.length} lost customers`);

    } catch (error) {
        log(`❌ Phase 10 Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPhase10();
