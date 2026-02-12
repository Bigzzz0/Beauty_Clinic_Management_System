
// Mocking dependencies
const courses = [
  { course_id: 1, session_count: 5 },
  { course_id: 2, session_count: 10 },
  { course_id: 3, session_count: 1 },
];

const customer_id = 123;
const transaction_id = 999;

// Generate items with varying quantities to simulate load
// Total calls: 10 + 5 + 20 + 10 = 45 calls
const items = [
  { course_id: 1, qty: 10 },
  { course_id: 2, qty: 5 },
  { course_id: 3, qty: 20 },
  { course_id: 1, qty: 10 },
];

// Mock transaction object
const tx = {
  customer_course: {
    create: async (args: any) => {
      // Simulate DB latency (network RTT + query time)
      await new Promise(resolve => setTimeout(resolve, 5));
      return { id: Math.floor(Math.random() * 1000), ...args.data };
    },
    createMany: async (args: any) => {
      // Simulate DB latency (single call + slightly longer for batch processing)
      await new Promise(resolve => setTimeout(resolve, 10));
      return { count: args.data.length };
    }
  }
};


async function originalImplementation() {
  const start = performance.now();

  for (const item of items) {
    if (item.course_id) {
      const course = courses.find(c => c.course_id === item.course_id);
      const sessionCount = course?.session_count || 1;

      // Create customer_course for each quantity purchased
      for (let i = 0; i < item.qty; i++) {
        await tx.customer_course.create({
          data: {
            customer_id,
            course_id: item.course_id,
            transaction_id: transaction_id,
            total_sessions: sessionCount,
            remaining_sessions: sessionCount,
            purchase_date: new Date(),
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  const end = performance.now();
  return end - start;
}

async function optimizedImplementation() {
  const start = performance.now();

  const customerCoursesToCreate = [];

  for (const item of items) {
      if (item.course_id) {
          const course = courses.find(c => c.course_id === item.course_id);
          const sessionCount = course?.session_count || 1;

          // Prepare data for batch creation
          for (let i = 0; i < item.qty; i++) {
              customerCoursesToCreate.push({
                  customer_id,
                  course_id: item.course_id,
                  transaction_id: transaction_id,
                  total_sessions: sessionCount,
                  remaining_sessions: sessionCount,
                  purchase_date: new Date(),
                  status: 'ACTIVE',
              });
          }
      }
  }

  if (customerCoursesToCreate.length > 0) {
      await tx.customer_course.createMany({
          data: customerCoursesToCreate,
      });
  }

  const end = performance.now();
  return end - start;
}

async function runBenchmark() {
  console.log('Running benchmark...');

  // Warmup
  await originalImplementation();
  await optimizedImplementation();

  const originalTime = await originalImplementation();
  console.log(`Original implementation took: ${originalTime.toFixed(2)}ms`);

  const optimizedTime = await optimizedImplementation();
  console.log(`Optimized implementation took: ${optimizedTime.toFixed(2)}ms`);

  const improvement = originalTime / optimizedTime;
  console.log(`Improvement: ${improvement.toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);
