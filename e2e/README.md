# Admin e2e (Playwright)

End-to-end tests for the admin app. `playwright.config.ts` starts the Angular dev server
(`ng serve admin`) automatically; the **backend admin host is not started for you**.

## Tests

- **anonymous → login** — visiting `/dashboard` without a token redirects to `/login`. Needs only
  the dev server; runs out of the box.
- **valid login → dashboard** — fills the login form, submits to the real backend through the dev
  proxy, and asserts the dashboard. Needs the admin backend running **and** credentials in env; it
  **skips** when those are absent (so the suite stays green locally/CI without a backend).

## Two-terminal dev flow

**Terminal 1 — admin backend** (from `nobilis-platform-back`, Java 25). Enable admin login and
supply the three secrets via env (never commit values):

```bash
NOBILIS_AUTH_JWT_SECRET=<base64, >=256-bit> \
NOBILIS_AUTH_ADMIN_LOGIN_EMAIL=admin@example.org \
NOBILIS_AUTH_ADMIN_LOGIN_PASSWORD_HASH=<bcrypt hash of the password> \
mvn -pl admin spring-boot:run \
  -Dspring-boot.run.arguments=--nobilis.auth.admin-login.enabled=true
```

**Terminal 2 — e2e** (from `nobilis-platform-front`). Give the test the SAME email + the _plaintext_
password whose bcrypt hash the backend was started with:

```bash
NOBILIS_E2E_ADMIN_EMAIL=admin@example.org \
NOBILIS_E2E_ADMIN_PASSWORD=<the plaintext password> \
npm run e2e
```

`npm run e2e` runs `playwright test`, which starts `ng serve admin` (reusing an already-running dev
server if present) and drives Chromium.

First-time only: install the browser with `npx playwright install chromium`.

See `.env.example` for the variable names.
