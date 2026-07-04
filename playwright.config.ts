import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Playwright e2e for the admin app.
 *
 * `webServer` starts the Angular dev server (`ng serve admin`), which proxies `/auth` to the admin
 * backend host (see `projects/admin/proxy.conf.json`). The BACKEND is NOT started here — the valid
 * login flow test needs it running separately with matching admin credentials (see `e2e/README.md`,
 * the two-terminal dev flow). The anonymous-redirect test needs only the dev server.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node_modules/.bin/ng serve admin --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
