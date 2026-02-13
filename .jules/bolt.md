## 2024-05-22 - In-Memory Filtering of Paginated Data
**Learning:** Found an API endpoint (`api/customers`) fetching a fixed page of data (`take: 10`) and THEN filtering it in memory (e.g., removing customers without debt). This breaks pagination (pages can be empty even if matches exist) and is inefficient.
**Action:** Always push filtering and sorting logic to the database query (Prisma `where` and `orderBy`) before pagination (`skip`/`take`) to ensure correctness and performance.

## 2024-05-24 - Parallelize Independent Prisma Queries
**Learning:** Found sequential Prisma queries in `api/reports/sales` that were independent of each other (fetching transactions and payment aggregates). This waterfall pattern added unnecessary latency.
**Action:** Use `Promise.all` to execute independent database queries concurrently, reducing total request time to the duration of the slowest query.
