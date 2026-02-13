import assert from 'assert/strict';

// Mock Data
const staff = [
  { staff_id: 1, full_name: 'Dr. Leo', position: 'Doctor' },
  { staff_id: 2, full_name: 'Dr. Ying', position: 'Doctor' },
  { staff_id: 8, full_name: 'Team JIIN', position: 'Sale' },
];

const customers = [
  { customer_id: 1, full_name: 'Cust A', personal_consult_id: 8, created_at: new Date('2024-05-01') },
  { customer_id: 2, full_name: 'Cust B', personal_consult_id: 8, created_at: new Date('2024-05-02') },
  { customer_id: 3, full_name: 'Cust C', personal_consult_id: 1, created_at: new Date('2024-05-03') },
  { customer_id: 4, full_name: 'Cust D', personal_consult_id: 1, created_at: new Date('2024-04-01') },
];

const transactions = [
  { transaction_id: 1, net_amount: 1000, customer: { personal_consult_id: 8 } },
  { transaction_id: 2, net_amount: 2000, customer: { personal_consult_id: 8 } },
  { transaction_id: 3, net_amount: 500, customer: { personal_consult_id: 1 } },
  { transaction_id: 4, net_amount: 1500, customer: { personal_consult_id: 2 } }, // Dr. Ying has transaction but no customers in mock (maybe customer deleted but transaction remains? Unlikely if FK constraints exist but possible if logic allows null)
];

// Helper: Group transactions by personal_consult_id
function groupTransactionsByConsultant(transactions: any[]) {
  const map = new Map<number, { sales: number; count: number }>();
  for (const t of transactions) {
    const consultId = t.customer?.personal_consult_id;
    if (consultId) {
      const current = map.get(consultId) || { sales: 0, count: 0 };
      current.sales += t.net_amount;
      current.count += 1;
      map.set(consultId, current);
    }
  }
  return map;
}

// Helper: Group new customers by personal_consult_id
function groupNewCustomersByConsultant(customers: any[], startDate: Date, endDate: Date) {
  const map = new Map<number, number>();
  for (const c of customers) {
    if (c.created_at >= startDate && c.created_at <= endDate && c.personal_consult_id) {
      const count = map.get(c.personal_consult_id) || 0;
      map.set(c.personal_consult_id, count + 1);
    }
  }
  return map;
}

// Helper: Count total customers by personal_consult_id
function countTotalCustomersByConsultant(customers: any[]) {
  const map = new Map<number, number>();
  for (const c of customers) {
    if (c.personal_consult_id) {
      const count = map.get(c.personal_consult_id) || 0;
      map.set(c.personal_consult_id, count + 1);
    }
  }
  return map;
}

async function verify() {
  const startDate = new Date('2024-05-01');
  const endDate = new Date('2024-05-31');

  // 1. Group transactions
  const transactionStats = groupTransactionsByConsultant(transactions);

  // 2. Group new customers
  const newCustomerStats = groupNewCustomersByConsultant(customers, startDate, endDate);

  // 3. Count total customers
  const totalCustomerStats = countTotalCustomersByConsultant(customers);

  // 4. Combine results
  const result = staff.map(s => {
    const tStats = transactionStats.get(s.staff_id) || { sales: 0, count: 0 };
    const newCount = newCustomerStats.get(s.staff_id) || 0;
    const totalCount = totalCustomerStats.get(s.staff_id) || 0;

    return {
      staff_id: s.staff_id,
      full_name: s.full_name,
      customer_count: totalCount,
      new_customers_this_month: newCount,
      total_sales: tStats.sales,
      transaction_count: tStats.count,
      average_per_customer: totalCount > 0 ? Math.round(tStats.sales / totalCount) : 0
    };
  });

  console.log('Results:', JSON.stringify(result, null, 2));

  // Assertions
  const teamJiin = result.find(r => r.staff_id === 8);
  assert(teamJiin);
  assert.equal(teamJiin.total_sales, 3000); // 1000 + 2000
  assert.equal(teamJiin.transaction_count, 2);
  assert.equal(teamJiin.customer_count, 2); // Cust A, Cust B
  assert.equal(teamJiin.new_customers_this_month, 2); // Both in May
  assert.equal(teamJiin.average_per_customer, 1500); // 3000 / 2

  const drLeo = result.find(r => r.staff_id === 1);
  assert(drLeo);
  assert.equal(drLeo.total_sales, 500);
  assert.equal(drLeo.transaction_count, 1);
  assert.equal(drLeo.customer_count, 2); // Cust C, Cust D
  assert.equal(drLeo.new_customers_this_month, 1); // Only Cust C in May
  assert.equal(drLeo.average_per_customer, 250); // 500 / 2

  const drYing = result.find(r => r.staff_id === 2);
  assert(drYing);
  assert.equal(drYing.total_sales, 1500);
  assert.equal(drYing.customer_count, 0); // No customers assigned
  assert.equal(drYing.average_per_customer, 0); // Div by zero check

  console.log('Verification successful!');
}

verify().catch(console.error);
