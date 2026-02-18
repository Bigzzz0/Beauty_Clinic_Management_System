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

## 2026-02-18 - Navigation State
**Learning:** Visual active states (colors/borders) are invisible to screen readers. `aria-current="page"` is the standard way to communicate "you are here".
**Action:** Always add `aria-current="page"` to the active Link in a navigation menu.

## 2026-02-18 - Decorative Noise
**Learning:** Dashboards often use icons for visual flair. Screen readers announce these as "image" or read their names, creating noise.
**Action:** Always add `aria-hidden="true"` to icons that are purely decorative or redundant with text.

## 2026-02-18 - Contextual Actions
**Learning:** A table full of "Edit" buttons is confusing for screen readers. They need to know *what* they are editing.
**Action:** Use `aria-label="Edit [Item Name]"` on repeated action buttons.

## 2026-02-18 - Async State Feedback
**Learning**: `disabled` state visually communicates inactivity but screen readers may just announce "unavailable". `aria-busy="true"` explicitly communicates processing.
**Action**: Added `aria-busy={isLoading}` to the base Button component.

## 2026-02-18 - Skip Links
**Learning**: Navigation menus are obstacles for keyboard users. A "Skip to content" link is the single most high-impact A11y feature for heavy dashboard users.
**Action**: Added a visible-on-focus Skip Link to the primary Dashboard Layout.
