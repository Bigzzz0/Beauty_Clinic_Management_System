# Bolt's Performance Journal

## 2026-02-18 - Initial Setup
**Learning:** Performance optimization requires a systematic approach. Started by profiling the codebase.
**Action:** Created this journal to track insights.
## 2026-02-18 - Database & Frontend Optimization
**Learning:** `include` in Prisma can be expensive for large related datasets (e.g. transaction history). Segregating queries with `groupBy` aggregation improved debt calculation efficiency significantly.
**Action:** Replaced `reduce` on full dataset with `_sum` aggregation.

## 2026-02-18 - Image Optimization
**Learning:** User-uploaded content (previews) can be optimized using `next/image` even if they are base64 or local blobs, but `width/height` must be handled dynamically or with `fill`.
**Action:** Implemented `next/image` for all gallery and preview components.
