# Palette's Journal

## 2026-02-17 - Dashboard Empty States
**Learning:** Positive empty states (e.g., "All Stock Healthy") reinforce good system status instead of just looking broken or empty.
**Action:** Always include a positive confirmation icon for "good" empty states.

## 2026-02-17 - Focus Visible
**Learning:** Custom interactive elements (like cards acting as links) often miss default browser focus styles.
**Action:** Always add `focus-visible` utility classes to non-button interactive elements (Links, Divs with click handlers).

## 2026-02-17 - POS Accessibility & Power Users
**Learning:** Power users in POS environments rely heavily on keyboards.
**Action:** Implemented `F2` (Search) and `F9` (Checkout) hotkeys.
**Learning:** Table Row clicks are convenient but bad for A11y.
**Action:** Moved navigation to explicit Links in the primary cell (Name), keeping the row hover for visual guidance but relying on the Link for interaction.

## 2026-02-18 - Mobile Input Optimization
**Learning:** `inputMode="decimal"` is essential for financial inputs on mobile, triggering the numeric keypad instead of the full keyboard.
**Action:** Added `inputMode="decimal"` to all monetary input fields in POS.

## 2026-02-18 - Lightweight Tooltips
**Learning:** Native `title` attribute is a valid, lightweight alternative to complex Tooltip components for simple icon buttons when bundle size or dependency constraints exist.
**Action:** Used `title` for the password visibility toggle.

## 2026-02-18 - Dialog Accessibility
**Learning:** Screen readers require context for modals. `DialogDescription` provides this without visual clutter if styled correctly.
**Action:** Ensure every `DialogContent` includes a `DialogDescription`.
