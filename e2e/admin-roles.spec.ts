import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.NOBILIS_E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NOBILIS_E2E_ADMIN_PASSWORD;

/**
 * Full roles CRUD against the live backend — the second CRUD-kit screen, and the first exercising a
 * PrimeNG `p-multiSelect` through the field-template escape hatch. Like the settings flow it needs
 * the admin backend on the db (`local`) profile AND credentials in env (plus the seeded permission
 * catalog), so it **skips** when those are absent — the suite stays green without a backend. It
 * creates a uniquely-coded role with a permission, edits the permissions, then deletes it, leaving
 * the catalog as it found it.
 */
test.describe('admin roles CRUD', () => {
  test('create with a permission, edit, then delete a role', async ({ page }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      'Requires the admin backend (local profile) + NOBILIS_E2E_ADMIN_EMAIL / NOBILIS_E2E_ADMIN_PASSWORD — see e2e/README.md',
    );

    const code = `E2E_ROLE_${Date.now()}`;

    // Sign in.
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Navigate to roles.
    await page.getByRole('button', { name: 'Roles' }).click();
    await expect(page).toHaveURL(/\/roles$/);
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();

    // Create with one permission chosen through the multiselect. Open it by clicking the visible
    // `p-multiselect` trigger — NOT `#permissions`, which PrimeNG puts on the hidden focus input
    // (`data-pc-section="hiddeninput"`) that is never actionable. Options render in a body-level
    // overlay, so `getByRole('option')` (page-scoped) finds them.
    await page.getByRole('button', { name: 'New role' }).click();
    await page.locator('#code').fill(code);
    await page.locator('#name').fill('E2E role');
    await page.locator('p-multiselect').click();
    await page.getByRole('option').first().click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: code })).toBeVisible();

    // Edit — change the permission set (code stays disabled/immutable). Same trigger, not the
    // hidden input; the multiselect is pre-populated with the created role's permission.
    const row = page.getByRole('row', { name: new RegExp(code) });
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.locator('p-multiselect').click();
    await page.getByRole('option').nth(1).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: code })).toBeVisible();

    // Delete it (confirm), and assert it is gone.
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
    await expect(page.getByRole('cell', { name: code })).toHaveCount(0);
  });
});
