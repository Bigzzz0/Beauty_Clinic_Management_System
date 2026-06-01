import { test, expect } from '@playwright/test';

test('login page has title and login form', async ({ page }) => {
  await page.goto('/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Beauty Clinic/);

  // Expect the form to exist
  const usernameInput = page.locator('input[name="username"]');
  await expect(usernameInput).toBeVisible();

  const passwordInput = page.locator('input[name="password"]');
  await expect(passwordInput).toBeVisible();
});
