import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.NOBILIS_E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NOBILIS_E2E_ADMIN_PASSWORD;

/**
 * Full settings CRUD against the live backend (the first CRUD-kit screen). Like the login flow it
 * needs the admin backend running with the `local` (db) profile AND credentials in env, so it
 * **skips** when those are absent — the suite stays green locally/CI without a backend. It creates a
 * uniquely-keyed setting, edits it, then deletes it, so it leaves the store as it found it.
 */
test.describe('admin settings CRUD', () => {
  test('create, edit, then delete a setting', async ({ page }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      'Requires the admin backend (local profile) + NOBILIS_E2E_ADMIN_EMAIL / NOBILIS_E2E_ADMIN_PASSWORD — see e2e/README.md',
    );

    const key = `e2e.setting.${Date.now()}`;

    // Sign in.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to settings.
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Create.
    await page.getByRole('button', { name: 'New setting' }).click();
    await page.locator('#key').fill(key);
    await page.locator('#value').fill('created');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: key })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'created', exact: true })).toBeVisible();

    // Edit the row we just created.
    const row = page.getByRole('row', { name: new RegExp(key.replace(/\./g, '\\.')) });
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.locator('#value').fill('edited');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: 'edited', exact: true })).toBeVisible();

    // Delete it (confirm), and assert it is gone.
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
    await expect(page.getByRole('cell', { name: key })).toHaveCount(0);
  });
});
