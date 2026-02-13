
import { prisma } from '../nextjs-app/src/lib/prisma';

async function main() {
  const staff = await prisma.staff.findMany({
    where: { is_active: true },
    include: {
      consulted_customers: true
    }
  });

  console.log('Staff count:', staff.length);
  staff.forEach(s => {
    console.log(`Staff ${s.full_name} (${s.staff_id}): ${s.consulted_customers.length} customers`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
