# Palette's Journal

## 2025-02-18 - Systematic Lack of Accessible Labels
**Learning:** The codebase systematically omits `aria-label` for icon-only buttons (Eye, Edit, Trash2) across critical flows (Login, Admin Dashboard). This indicates a lack of accessibility checks in the component creation process.
**Action:** Introduced accessible labels as a standard practice for all future icon-only buttons.

## 2025-02-18 - Implicitly Labeled Inputs
**Learning:** Date inputs placed between navigation arrows often rely on visual context but lack explicit labels for screen readers.
**Action:** Added `aria-label="เลือกวันที่"` to date inputs to ensure accessibility without breaking the visual design.
