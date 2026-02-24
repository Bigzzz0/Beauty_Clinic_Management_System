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

## 2026-02-24 - Consistent Keyboard Focus
**Learning:** Default browser focus rings are often hidden by Tailwind reset or specific component styles, making keyboard navigation difficult for non-button interactive elements like table headers or icon buttons.
**Action:** Always add explicit `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary` to interactive elements to ensure clear keyboard accessibility.

## 2026-02-24 - Accessibility Context and Associations
**Learning:** Screen readers depend on explicit relationships in HTML (`htmlFor` linking a Label to a Switch id) and contextual descriptions (like visually hidden `DialogDescription`s) to navigate functionally, rather than just reading raw text on screen. 
**Action:** Always link form controls to labels explicitly with IDs and provide a `DialogDescription` for all Modals to ensure sufficient context.

## 2026-02-24 - aria-busy and Loading States
**Learning:** On forms, simply disabling a button during save does not communicate to screen readers *why* it is disabled. `aria-busy="true"` on the button (or surrounding form) tells the assistive tech: "I am currently processing your request".
**Action:** Add `aria-busy={isMutationPending}` to save/submit buttons, and update button text dynamically to reflect loading state (e.g., 'กำลังบันทึก...').

## 2026-02-24 - Contextual Aria Labels and Live Regions
**Learning:** Generic labels like "Remove" or generic loading skeletons are confusing. A screen reader user needs to know *what* they are removing (e.g. `aria-label="Remove Botox Aestox"`). Similarly, when a page section is loading via skeleton, wrapping it in `<div aria-busy="true" aria-live="polite">` informs the screen reader that content is loading and will update soon.
**Action:** Always inject variables into `aria-label`s for list items, and add `aria-busy` and `aria-live` to loading skeleton containers.

## 2026-02-24 - Semantic HTML Form Bindings and Role Status
**Learning:** Input fields are completely divorced from their visual `<Label>` in the DOM unless explicitly tied together via `id` and `htmlFor`. Additionally, a visual loading spinner requires `role="status"` and a descriptive `aria-label` to be perceivable to screen readers that cannot see the CSS animation.
**Action:** Always verify every form input has a unique `id` that matches the `htmlFor` of its labeling `<Label>`. Always add `role="status"` and `aria-label="กำลังโหลด..."` to any JSX returning a visual spinner.
