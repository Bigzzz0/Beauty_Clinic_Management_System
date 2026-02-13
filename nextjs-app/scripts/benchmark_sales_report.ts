
// Mock request/response classes
class NextRequest {
    url: string
    constructor(url: string) {
        this.url = url
    }
}

class NextResponse {
    static json(body: any, options?: any) {
        return { body, options }
    }
}

// Mock Prisma
const prisma = {
    transaction_header: {
        findMany: async (args: any) => {
            // Simulate heavy query for transactions
            await new Promise(resolve => setTimeout(resolve, 150));
            return Array.from({ length: 100 }, (_, i) => ({
                transaction_id: i,
                net_amount: 100,
                remaining_balance: 0,
                transaction_date: new Date(),
                payment_log: [
                    { amount_paid: 50, payment_method: 'CASH' },
                    { amount_paid: 50, payment_method: 'TRANSFER' }
                ]
            }));
        }
    },
    payment_log: {
        groupBy: async (args: any) => {
            // Simulate heavy aggregation query
            await new Promise(resolve => setTimeout(resolve, 100));
            return [
                { payment_method: 'CASH', _sum: { amount_paid: 5000 } },
                { payment_method: 'TRANSFER', _sum: { amount_paid: 5000 } }
            ];
        }
    }
};

// Current Implementation (Sequential)
async function GET_Current(request: any) {
    const start = performance.now();

    // 1. Fetch transactions
    const transactions = await prisma.transaction_header.findMany({});

    // 2. Fetch payment breakdown
    const paymentsByMethod = await prisma.payment_log.groupBy({});

    const end = performance.now();
    return end - start;
}

// Optimized Implementation (Parallel)
async function GET_Optimized(request: any) {
    const start = performance.now();

    // Parallelize both queries
    const [transactions, paymentsByMethod] = await Promise.all([
        prisma.transaction_header.findMany({}),
        prisma.payment_log.groupBy({})
    ]);

    const end = performance.now();
    return end - start;
}

async function runBenchmark() {
    console.log('Running Sales Report Benchmark...');

    // Warmup
    await GET_Current(new NextRequest('http://localhost/api/reports/sales'));

    // Measure Current
    const timeCurrent = await GET_Current(new NextRequest('http://localhost/api/reports/sales'));
    console.log(`Sequential: ${timeCurrent.toFixed(2)}ms`);

    // Measure Optimized
    const timeOptimized = await GET_Optimized(new NextRequest('http://localhost/api/reports/sales'));
    console.log(`Parallel:   ${timeOptimized.toFixed(2)}ms`);

    const improvement = ((timeCurrent - timeOptimized) / timeCurrent) * 100;
    console.log(`Improvement: ${improvement.toFixed(2)}%`);
}

runBenchmark();
