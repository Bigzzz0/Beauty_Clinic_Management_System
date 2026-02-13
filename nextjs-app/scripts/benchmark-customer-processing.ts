
// Minimal mocks for types and classes
class NextRequest {
    url: string
    constructor(url: string) {
        this.url = url
    }
}

// Mock Data Generation
const CUSTOMER_COUNT = 100;
const TX_PER_CUSTOMER = 50;

function generateCustomers(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        customer_id: i + 1,
        full_name: `Customer ${i + 1}`,
        // ... other fields
    }));
}

function generateTransactions(customerId: number, count: number) {
    return Array.from({ length: count }, (_, i) => ({
        transaction_id: i + 1,
        customer_id: customerId,
        remaining_balance: Math.random() > 0.5 ? 100 : 0,
        transaction_date: new Date(Date.now() - Math.random() * 10000000000),
    }));
}

// Scenario 1: Current Implementation (Fetch ALL transactions)
async function runCurrentImplementation() {
    console.log('--- Current Implementation ---');
    const start = performance.now();

    // 1. Simulate Fetching Customers WITH Transactions included
    // In reality, Prisma would instantiate objects for all these transactions.
    const customers = generateCustomers(CUSTOMER_COUNT).map(c => ({
        ...c,
        transaction_header: generateTransactions(c.customer_id, TX_PER_CUSTOMER)
    }));

    const fetchEnd = performance.now();

    // 2. Process Data (Map/Reduce in Memory)
    const customersWithStats = customers.map((c) => {
        const totalDebt = c.transaction_header.reduce(
            (sum, t) => sum + Number(t.remaining_balance || 0),
            0
        )
        // Sort to find last visit (simulating the DB order or manual find)
        // The original code relied on DB sort, so finding max here is fair comparison if we assume DB returns sorted.
        // But if we access [0], it's O(1).
        const lastVisit = c.transaction_header[0]?.transaction_date || null

        return {
            ...c,
            total_debt: totalDebt,
            last_visit: lastVisit,
            // Remove transaction_header from result to simulate API response shape
            transaction_header: undefined
        }
    });

    const end = performance.now();

    console.log(`Simulated Fetch Time (mock): ${(fetchEnd - start).toFixed(2)}ms`);
    console.log(`Processing Time: ${(end - fetchEnd).toFixed(2)}ms`);
    console.log(`Total Objects Created (approx): ${CUSTOMER_COUNT * (1 + TX_PER_CUSTOMER)}`);
    return end - start;
}

// Scenario 2: Optimized Implementation (Aggregation Query)
async function runOptimizedImplementation() {
    console.log('\n--- Optimized Implementation ---');
    const start = performance.now();

    // 1. Simulate Fetching Customers WITHOUT Transactions
    const customers = generateCustomers(CUSTOMER_COUNT);

    // 2. Simulate Fetching Aggregation Data
    // We only get 1 object per customer
    const transactionStats = customers.map(c => ({
        customer_id: c.customer_id,
        _sum: { remaining_balance: TX_PER_CUSTOMER * 50 }, // Approximation
        _max: { transaction_date: new Date() }
    }));

    const fetchEnd = performance.now();

    // 3. Process Data (Map/Lookup)
    // Create Map for O(1) lookup
    const statsMap = new Map(transactionStats.map(s => [s.customer_id, s]));

    const customersWithStats = customers.map((c) => {
        const stats = statsMap.get(c.customer_id);
        return {
            ...c,
            total_debt: Number(stats?._sum.remaining_balance || 0),
            last_visit: stats?._max.transaction_date || null,
        }
    });

    const end = performance.now();

    console.log(`Simulated Fetch Time (mock): ${(fetchEnd - start).toFixed(2)}ms`);
    console.log(`Processing Time: ${(end - fetchEnd).toFixed(2)}ms`);
    console.log(`Total Objects Created (approx): ${CUSTOMER_COUNT * 2}`); // Customers + Stats
    return end - start;
}

async function runBenchmark() {
    console.log(`Benchmarking with ${CUSTOMER_COUNT} customers, ${TX_PER_CUSTOMER} transactions each.`);

    await runCurrentImplementation();
    await runOptimizedImplementation();
}

runBenchmark();
