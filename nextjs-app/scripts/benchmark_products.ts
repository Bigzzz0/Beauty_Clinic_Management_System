
// Mock request/response
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
const mockProducts = Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: 'Category',
    inventory: { full_qty: 10, opened_qty: 5 }
}));

const prisma = {
    product: {
        findMany: async (args: any) => {
            // Simulate DB delay
            await new Promise(resolve => setTimeout(resolve, 5));

            // Simulate filtering/sorting if needed, but for now just return all or slice
            let result = [...mockProducts];

            if (args.take !== undefined && args.skip !== undefined) {
                return result.slice(args.skip, args.skip + args.take);
            }
            return result;
        },
        count: async (args: any) => {
            return mockProducts.length;
        }
    }
};

// The function to test (Current Implementation)
async function GET_Current(request: any) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const where: Record<string, unknown> = {};

        if (!includeInactive) {
            where['is_active'] = true;
        }

        if (category && category !== 'all') {
            where['category'] = category;
        }

        if (search) {
            where['OR'] = [
                { product_name: { contains: search } },
                { product_code: { contains: search } },
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                inventory: true,
            },
            orderBy: { product_name: 'asc' },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// The function to test (Optimized Implementation)
async function GET_Optimized(request: any) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const includeInactive = searchParams.get('includeInactive') === 'true';

        // Pagination
        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '0');

        const where: Record<string, unknown> = {};

        if (!includeInactive) {
            where['is_active'] = true;
        }

        if (category && category !== 'all') {
            where['category'] = category;
        }

        if (search) {
            where['OR'] = [
                { product_name: { contains: search } },
                { product_code: { contains: search } },
            ];
        }

        const queryOptions: any = {
            where,
            include: {
                inventory: true,
            },
            orderBy: { product_name: 'asc' },
        };

        if (page > 0 && limit > 0) {
            queryOptions.skip = (page - 1) * limit;
            queryOptions.take = limit;
        }

        // Parallelize count and findMany
        const [products, total] = await Promise.all([
            prisma.product.findMany(queryOptions),
            prisma.product.count({ where })
        ]);

        const response = NextResponse.json(products);

        return response;
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

async function runBenchmark() {
    console.log('Running benchmark with 10,000 mock products...');

    // Warmup
    await GET_Current(new NextRequest('http://localhost/api/products'));

    // Measure Current (including JSON stringify simulation)
    const startCurrent = performance.now();
    const resCurrent = await GET_Current(new NextRequest('http://localhost/api/products'));
    const jsonStartCurrent = performance.now();
    const jsonCurrent = JSON.stringify(resCurrent.body);
    const endCurrent = performance.now();

    console.log(`Current Implementation (Fetch + Serialize All): ${(endCurrent - startCurrent).toFixed(2)}ms`);
    console.log(`- Handler time: ${(jsonStartCurrent - startCurrent).toFixed(2)}ms`);
    console.log(`- Serialization time: ${(endCurrent - jsonStartCurrent).toFixed(2)}ms`);
    console.log(`Items returned: ${resCurrent.body.length}`);
    console.log(`Payload size: ${(jsonCurrent.length / 1024).toFixed(2)} KB`);

    // Measure Optimized (Page 1, Limit 10)
    const startOptimized = performance.now();
    const resOptimized = await GET_Optimized(new NextRequest('http://localhost/api/products?page=1&limit=10'));
    const jsonStartOptimized = performance.now();
    const jsonOptimized = JSON.stringify(resOptimized.body);
    const endOptimized = performance.now();

    console.log(`Optimized Implementation (Fetch + Serialize Page 1): ${(endOptimized - startOptimized).toFixed(2)}ms`);
    console.log(`- Handler time: ${(jsonStartOptimized - startOptimized).toFixed(2)}ms`);
    console.log(`- Serialization time: ${(endOptimized - jsonStartOptimized).toFixed(2)}ms`);
    console.log(`Items returned: ${resOptimized.body.length}`);
    console.log(`Payload size: ${(jsonOptimized.length / 1024).toFixed(2)} KB`);
}

runBenchmark();
