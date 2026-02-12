## 2024-05-23 - Accessibility Gaps and Build Stability
**Learning:** The application had several accessibility gaps in key navigation components (Header), specifically missing ARIA labels on icon-only buttons. Additionally, the codebase had significant TypeScript build errors in API routes, indicating a lack of CI/CD checks or local verification before previous commits.
**Action:** Always run `pnpm build` to verify the codebase state before starting work. Ensure all interactive elements, especially icon-only buttons, have descriptive `aria-label` attributes.

## 2024-05-23 - Build Verification vs. Runtime Verification
**Learning:** While `pnpm build` confirmed syntax correctness, the lack of a local database (`.env` missing) prevented full runtime verification via Playwright. I relied on static analysis and build success for verification.
**Action:** In future tasks, consider if mocking or a local database setup is feasible for deeper verification, or if static checks suffice for simple UI changes like ARIA labels.
