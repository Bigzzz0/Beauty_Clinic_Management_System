## 2024-05-22 - shadcn/ui Table Sorting Accessibility
**Learning:** `TableHead` elements with `onClick` handlers are not keyboard accessible (no focus state, cannot be activated with Enter/Space).
**Action:** Wrap sortable column headers in a `Button` component with `variant="ghost"` and apply negative margin (`-ml-3`) to maintain visual alignment while ensuring keyboard accessibility and screen reader support.

## 2024-05-23 - shadcn/ui Table Sorting Visuals
**Learning:** Converting native sort headers to `Button` components removes default browser spacing.
**Action:** When using `Button` for table sorting, always add `gap-1` or appropriate spacing to separate the label from the sort icon.
