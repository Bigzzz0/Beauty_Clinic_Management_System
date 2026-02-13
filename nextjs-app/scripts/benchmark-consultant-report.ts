
// Simulate Prisma types
interface Transaction {
    transaction_id: number;
    net_amount: number;
    customer_id: number;
    customer: {
        personal_consult_id: number | null;
    };
}

interface Customer {
    customer_id: number;
    personal_consult_id: number | null;
}

interface GroupedTransaction {
    customer_id: number;
    _sum: {
        net_amount: number | null;
    };
    _count: {
        transaction_id: number;
    };
}

// Generate Mock Data
const NUM_TRANSACTIONS = 10000;
const NUM_CUSTOMERS = 500;
const NUM_CONSULTANTS = 10;

const customers: Customer[] = Array.from({ length: NUM_CUSTOMERS }, (_, i) => ({
    customer_id: i + 1,
    personal_consult_id: (i % NUM_CONSULTANTS) + 1,
}));

const transactions: Transaction[] = Array.from({ length: NUM_TRANSACTIONS }, (_, i) => {
    const customerId = (i % NUM_CUSTOMERS) + 1;
    return {
        transaction_id: i + 1,
        net_amount: 100 + (i % 100),
        customer_id: customerId,
        customer: {
            personal_consult_id: customers[customerId - 1].personal_consult_id,
        },
    };
});

console.log(`Mock Data: ${NUM_TRANSACTIONS} Transactions, ${NUM_CUSTOMERS} Customers, ${NUM_CONSULTANTS} Consultants`);

// --- Current Implementation Simulation ---
console.log('\n--- Current Implementation ---');
const startCurrent = performance.now();

// Simulate DB Fetch (fetching all transactions with customer relation)
// In reality, this transfers 10,000 objects over the network
const fetchedTransactions = transactions;

const salesStatsCurrent = new Map<number, { sales: number; count: number }>();

fetchedTransactions.forEach(t => {
    const consultantId = t.customer.personal_consult_id;
    if (consultantId) {
        const current = salesStatsCurrent.get(consultantId) || { sales: 0, count: 0 };
        current.sales += Number(t.net_amount);
        current.count += 1;
        salesStatsCurrent.set(consultantId, current);
    }
});

const endCurrent = performance.now();
console.log(`Time taken (JS loop over ${NUM_TRANSACTIONS} items): ${(endCurrent - startCurrent).toFixed(4)} ms`);
console.log(`Operations: ${NUM_TRANSACTIONS} iterations`);


// --- Optimized Implementation Simulation ---
console.log('\n--- Optimized Implementation ---');
// const startOptimized = performance.now();

// Simulate DB Aggregation (GroupBy customer_id)
// In reality, this transfers 500 objects over the network
const groupedTransactions: GroupedTransaction[] = [];
const customerStats = new Map<number, { sum: number; count: number }>();

transactions.forEach(t => {
    const current = customerStats.get(t.customer_id) || { sum: 0, count: 0 };
    current.sum += t.net_amount;
    current.count += 1;
    customerStats.set(t.customer_id, current);
});

customerStats.forEach((val, key) => {
    groupedTransactions.push({
        customer_id: key,
        _sum: { net_amount: val.sum },
        _count: { transaction_id: val.count }
    });
});

// Simulate DB Fetch Customers (fetching only involved customers)
const involvedCustomerIds = groupedTransactions.map(t => t.customer_id);
const fetchedCustomers = customers.filter(c => involvedCustomerIds.includes(c.customer_id));

// Map customers
const customerConsultantMap = new Map<number, number | null>();
fetchedCustomers.forEach(c => {
    customerConsultantMap.set(c.customer_id, c.personal_consult_id);
});

// Aggregate
const salesStatsOptimized = new Map<number, { sales: number; count: number }>();

groupedTransactions.forEach(stat => {
    const consultantId = customerConsultantMap.get(stat.customer_id);
    if (consultantId) {
        const current = salesStatsOptimized.get(consultantId) || { sales: 0, count: 0 };
        current.sales += Number(stat._sum.net_amount || 0);
        current.count += stat._count.transaction_id;
        salesStatsOptimized.set(consultantId, current);
    }
});

// const endOptimized = performance.now();
// Note: The time measured here includes the "simulated DB aggregation" in JS, which is unfair.
// We only care about the post-fetch processing time in Node.js
// But strictly speaking, the optimization moves processing from Node.js (loop N) to DB (GroupBy N -> K).
// So "Post-Fetch Processing" is iterating K items vs N items.

const postFetchStart = performance.now();
const salesStatsOptimizedReal = new Map<number, { sales: number; count: number }>();
groupedTransactions.forEach(stat => {
    const consultantId = customerConsultantMap.get(stat.customer_id);
    if (consultantId) {
        const current = salesStatsOptimizedReal.get(consultantId) || { sales: 0, count: 0 };
        current.sales += Number(stat._sum.net_amount || 0);
        current.count += stat._count.transaction_id;
        salesStatsOptimizedReal.set(consultantId, current);
    }
});
const postFetchEnd = performance.now();

console.log(`Time taken (JS loop over ${NUM_CUSTOMERS} groups): ${(postFetchEnd - postFetchStart).toFixed(4)} ms`);
console.log(`Operations: ${NUM_CUSTOMERS} iterations (vs ${NUM_TRANSACTIONS})`);

// Verify results match
let match = true;
salesStatsCurrent.forEach((val, key) => {
    const opt = salesStatsOptimized.get(key);
    if (!opt || opt.sales !== val.sales || opt.count !== val.count) {
        match = false;
        console.error(`Mismatch for consultant ${key}: Expected ${JSON.stringify(val)}, Got ${JSON.stringify(opt)}`);
    }
});

if (match) {
    console.log('\n✅ Results Match!');
} else {
    console.log('\n❌ Results Mismatch!');
}
