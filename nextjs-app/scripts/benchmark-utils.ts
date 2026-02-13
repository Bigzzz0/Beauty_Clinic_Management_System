
// Simple benchmark for Intl.NumberFormat caching

const iterations = 100_000;

console.log(`Running benchmark with ${iterations.toLocaleString()} iterations...`);

console.time('Non-Optimized (New Instance Every Time)');
for (let i = 0; i < iterations; i++) {
  const formatter = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  });
  formatter.format(i);
}
console.timeEnd('Non-Optimized (New Instance Every Time)');

const cachedFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
});

console.time('Optimized (Cached Instance)');
for (let i = 0; i < iterations; i++) {
  cachedFormatter.format(i);
}
console.timeEnd('Optimized (Cached Instance)');
