## 2024-05-22 - In-Memory Filtering of Paginated Data
**Learning:** Found an API endpoint (`api/customers`) fetching a fixed page of data (`take: 10`) and THEN filtering it in memory (e.g., removing customers without debt). This breaks pagination (pages can be empty even if matches exist) and is inefficient.
**Action:** Always push filtering and sorting logic to the database query (Prisma `where` and `orderBy`) before pagination (`skip`/`take`) to ensure correctness and performance.
