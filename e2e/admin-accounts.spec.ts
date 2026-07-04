import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.NOBILIS_E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NOBILIS_E2E_ADMIN_PASSWORD;

/**
 * Accounts screen against the live backend — the third CRUD-kit screen (a status `p-select` and two
 * field-template `p-multiSelect`s). This screen MANAGES existing accounts (no create), and the
 * configured admin signs in WITHOUT an account row (4d), so a fresh database lists ZERO accounts.
 * The mutate-path round-trip (edit status/realms/roles) therefore waits for account creation (a
 * later milestone) — a self-contained credentialed spec cannot seed a row through this UI. This spec
 * proves the screen mounts, the guard admits an authenticated admin, and the list renders (its
 * empty-state when there are no accounts). The credentialed test skips without NOBILIS_E2E_*; the
 * anonymous-guard test needs only the dev server.
 */
test.describe('admin accounts screen', () => {
  test('anonymous visiting accounts is redirected to login', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('authenticated admin reaches the accounts screen and the list renders', async ({ page }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      'Requires the admin backend (local profile) + NOBILIS_E2E_ADMIN_EMAIL / NOBILIS_E2E_ADMIN_PASSWORD — see e2e/README.md',
    );

    // Sign in.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to accounts.
    await page.getByRole('button', { name: 'Accounts' }).click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();

    // The table renders (its column headers) whether the list has rows or is empty.
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });
});
