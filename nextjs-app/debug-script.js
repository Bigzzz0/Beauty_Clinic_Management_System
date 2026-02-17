const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
    try {
        console.log('1. Connecting to DB...');
        await prisma.$connect();
        console.log('2. Connected successfully.');

        console.log('3. Fetching simple customer list...');
        const count = await prisma.customer.count();
        console.log(`4. Customer count: ${count}`);

        console.log('5. Testing inclusion query...');
        const customers = await prisma.customer.findMany({
            take: 1,
            include: {
                personal_consultant: true
            }
        });
        console.log('6. Query success. Encoded result:', JSON.stringify(customers, null, 2));

    } catch (e) {
        console.error('ERROR OCCURRED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
