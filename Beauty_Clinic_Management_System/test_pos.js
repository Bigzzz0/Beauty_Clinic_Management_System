const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testPOS() {
    try {
        console.log('Testing POS Transaction...');

        // 1. Get Product to Sell
        const productsRes = await axios.get(`${API_URL}/products`);
        const botox = productsRes.data.find(p => p.product_name.includes('Botox Aestox (100u)'));

        if (!botox) throw new Error('Botox product not found');

        const initialFull = botox.full_qty;
        const initialOpened = botox.opened_qty;
        console.log(`Initial Stock: Full=${initialFull}, Opened=${initialOpened}`);

        // 2. Create Transaction
        console.log('\nCreating Transaction...');
        const transactionData = {
            customer_id: 1,
            staff_id: 6, // Admin May
            items: [
                {
                    product_id: botox.product_id,
                    qty_used: 20, // Deduct 20 units
                    unit_price: 5999,
                    staff_ids: [
                        { id: 1, role: 'Doctor', fee: 500 }, // Dr. Leo
                        { id: 2, role: 'Therapist', fee: 50 } // Gift
                    ]
                }
            ],
            discount: 0,
            amount_paid: 5999,
            payment_method: 'CASH'
        };

        const transRes = await axios.post(`${API_URL}/transactions`, transactionData);
        console.log('✅ Transaction Created:', transRes.data);

        // 3. Verify Stock Deduction
        console.log('\nVerifying Stock Deduction...');
        const productsRes2 = await axios.get(`${API_URL}/products`);
        const botoxAfter = productsRes2.data.find(p => p.product_id === botox.product_id);

        console.log(`New Stock: Full=${botoxAfter.full_qty}, Opened=${botoxAfter.opened_qty}`);

        // Logic check: 
        // If initialOpened >= 20, newOpened = initialOpened - 20, full same.
        // If initialOpened < 20, full should decrease.

        if (botoxAfter.full_qty <= initialFull && botoxAfter.opened_qty !== initialOpened) {
            console.log('✅ Stock deducted correctly');
        } else {
            console.error('❌ Stock deduction failed or logic mismatch');
        }

    } catch (error) {
        console.error('❌ POS Test Failed:', error.response ? error.response.data : error.message);
    }
}

testPOS();
