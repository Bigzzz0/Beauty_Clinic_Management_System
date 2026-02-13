## 2024-05-22 - shadcn/ui Table Sorting Accessibility
**Learning:** `TableHead` elements with `onClick` handlers are not keyboard accessible (no focus state, cannot be activated with Enter/Space).
**Action:** Wrap sortable column headers in a `Button` component with `variant="ghost"` and apply negative margin (`-ml-3`) to maintain visual alignment while ensuring keyboard accessibility and screen reader support.
