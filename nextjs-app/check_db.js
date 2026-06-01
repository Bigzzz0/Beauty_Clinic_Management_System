const { PrismaClient } = require('@prisma/client'); 
const p = new PrismaClient(); 
p.commission_rate.findMany().then(r => console.log(JSON.stringify(r))).finally(() => p.$disconnect());
