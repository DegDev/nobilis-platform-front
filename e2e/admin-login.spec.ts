import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.NOBILIS_E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NOBILIS_E2E_ADMIN_PASSWORD;

test.describe('admin contour', () => {
  test('anonymous visiting a protected route is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  });

  test('valid credentials land on the dashboard', async ({ page }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      'Requires the admin backend running + NOBILIS_E2E_ADMIN_EMAIL / NOBILIS_E2E_ADMIN_PASSWORD — see e2e/README.md',
    );

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
    await expect(page.getByText(ADMIN_EMAIL!)).toBeVisible();
  });
});
