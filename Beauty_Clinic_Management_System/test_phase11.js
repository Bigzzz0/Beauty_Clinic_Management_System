const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const OUTPUT_FILE = 'phase11_test_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(OUTPUT_FILE, message + '\n');
}

async function testPhase11() {
    fs.writeFileSync(OUTPUT_FILE, 'Starting Phase 11 Test (POS & Finance)...\n');
    try {
        // 1. Login
        log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'dr_leo', password: '1234' });
        const token = loginRes.data.token;
        log('✅ Login Successful');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create Transaction with Split Payment & Staff
        log('\n2. Creating Transaction (Split Payment & Staff)...');
        const txRes = await axios.post(`${API_URL}/transactions`, {
            customer_id: 1,
            staff_id: 1,
            items: [{
                product_id: 1,
                qty_used: 1,
                unit_price: 1000,
                doctor_id: 1,
                therapist_id: 2
            }],
            total_amount: 1000,
            discount: 0,
            net_amount: 1000,
            payments: [
                { method: 'CASH', amount: 500 },
                { method: 'TRANSFER', amount: 500 }
            ]
        }, config);
        const txId = txRes.data.transactionId;
        log(`✅ Transaction Created: #${txId}`);

        // 3. Create Partial Payment Transaction (Debtor)
        log('\n3. Creating Partial Payment Transaction...');
        const debtTxRes = await axios.post(`${API_URL}/transactions`, {
            customer_id: 1,
            staff_id: 1,
            items: [{ product_id: 1, qty_used: 1, unit_price: 2000 }],
            total_amount: 2000,
            discount: 0,
            net_amount: 2000,
            payments: [
                { method: 'CASH', amount: 500 } // Paid 500, Owe 1500
            ]
        }, config);
        const debtTxId = debtTxRes.data.transactionId;
        log(`✅ Debtor Transaction Created: #${debtTxId}`);

        // 4. Check Debtor List
        log('\n4. Checking Debtor List...');
        const debtorsRes = await axios.get(`${API_URL}/debtors`, config);
        const debtor = debtorsRes.data.find(d => d.transaction_id === debtTxId);
        if (debtor && Number(debtor.remaining_balance) === 1500) {
            log('✅ Debtor found with correct balance (1500)');
        } else {
            log('❌ Debtor check failed');
        }

        // 5. Pay Debt
        log('\n5. Paying Debt...');
        await axios.post(`${API_URL}/debtors/pay`, {
            transaction_id: debtTxId,
            amount: 1500,
            payment_method: 'TRANSFER',
            staff_id: 1
        }, config);
        log('✅ Debt Paid Successfully');

    } catch (error) {
        log(`❌ Phase 11 Test Failed: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

testPhase11();
