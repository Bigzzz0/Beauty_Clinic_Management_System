const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testInventoryAPI() {
    try {
        console.log('Testing Inventory API...');

        // 1. Get Products
        console.log('\n1. Fetching Products...');
        const productsRes = await axios.get(`${API_URL}/products`);
        console.log(`✅ Fetched ${productsRes.data.length} products`);

        const botox = productsRes.data.find(p => p.product_name.includes('Botox Aestox (100u)'));
        if (!botox) throw new Error('Botox product not found');
        console.log(`   Target Product: ${botox.product_name} (ID: ${botox.product_id})`);
        console.log(`   Current Stock: Full=${botox.full_qty}, Opened=${botox.opened_qty}`);

        // 2. Stock In
        console.log('\n2. Testing Stock In...');
        await axios.post(`${API_URL}/stock-in`, {
            product_id: botox.product_id,
            qty_main: 5,
            staff_id: 1, // Assuming staff ID 1 exists
            evidence_image: 'http://example.com/evidence.jpg',
            lot_number: 'LOT123',
            expiry_date: '2026-01-01',
            note: 'Test Stock In'
        });
        console.log('✅ Stock In successful');

        // 3. Stock Deduct (Liquid Logic)
        console.log('\n3. Testing Stock Deduct (Liquid)...');
        // Deduct 50 units. If opened_qty < 50, it should break a full bottle.
        const deductRes = await axios.post(`${API_URL}/stock-deduct`, {
            product_id: botox.product_id,
            qty_used: 50,
            staff_id: 1,
            note: 'Test Deduction'
        });
        console.log('✅ Stock Deduct successful');
        console.log(`   New Stock: Full=${deductRes.data.current_stock.full_qty}, Opened=${deductRes.data.current_stock.opened_qty}`);

    } catch (error) {
        console.error('❌ API Test Failed:', error.response ? error.response.data : error.message);
    }
}

testInventoryAPI();
