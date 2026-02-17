const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LOG_FILE = 'debug-output.txt';
function log(msg) {
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (e) {
        // ignore
    }
}

// Clear log file
try { fs.writeFileSync(LOG_FILE, ''); } catch (e) { }

async function main() {
    try {
        log('1. Starting connection...');
        await prisma.$connect();
        log('2. Connected successfully!');

        log('3. Fetching customer count...');
        const count = await prisma.customer.count();
        log('4. Customer count: ' + count);

        log('5. Fetching customers text...');
        const customers = await prisma.customer.findMany({ take: 1 });
        log('6. Customers: ' + JSON.stringify(customers));

    } catch (e) {
        log('ERROR: ' + e.message);
        log('STACK: ' + e.stack);
    } finally {
        await prisma.$disconnect();
        log('7. Disconnected.');
    }
}

main();
