const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testDashboard() {
    try {
        console.log('Testing Dashboard API...');

        // 1. Get Stats
        console.log('\n1. Fetching Stats...');
        const statsRes = await axios.get(`${API_URL}/dashboard/stats`);
        console.log('✅ Stats:', statsRes.data);

        if (statsRes.data.transaction_count > 0) {
            console.log('   Transaction count reflects recent activity.');
        } else {
            console.warn('   Transaction count is 0 (Unexpected if POS test passed).');
        }

        // 2. Get Low Stock
        console.log('\n2. Fetching Low Stock...');
        const lowStockRes = await axios.get(`${API_URL}/dashboard/low-stock`);
        console.log(`✅ Low Stock Items: ${lowStockRes.data.length}`);

        if (lowStockRes.data.length > 0) {
            console.log('   Example Low Stock:', lowStockRes.data[0].product_name);
        }

    } catch (error) {
        console.error('❌ Dashboard Test Failed:', error.response ? error.response.data : error.message);
    }
}

testDashboard();
