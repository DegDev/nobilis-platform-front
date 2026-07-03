# Sources Log — nobilis-platform-front

Clean-room record: for every non-trivial decision, the public pattern / standard / doc it derives
from. Mirror of the backend `nobilis-platform-back/docs/sources-log.md`. No code or convention here
comes from a third-party or formerly-private repository — only public standards and official docs.

---

## 2026-06-28 — Milestone 00-foundation, task 5: scaffold the Angular workspace

Scaffolded the Angular workspace with three projects (`common` library, `admin` + `app`
applications) using the official Angular CLI, then wired formatting/linting. Everything generated
from the CLI's own schematics — nothing hand-copied from another project.

### Pinned versions (exact, no floating ranges)

| Tool / package          | Version  | Source / why                                                       |
| ----------------------- | -------- | ------------------------------------------------------------------ |
| Node.js                 | 24.18.0  | `.nvmrc` = `lts/*` → current latest LTS; required by Angular CLI 22 |
| npm                     | 11.16.0  | bundled with Node 24.18.0                                           |
| Angular (core/CLI)      | 22.0.4   | latest stable on npm (`@angular/cli` dist-tag `latest`)            |
| TypeScript              | 6.0.3    | Angular 22 peer range `>=6.0 <6.1` (`@angular/compiler-cli`)       |
| RxJS                    | 7.8.2    | Angular 22 CLI default                                             |
| Vitest                  | 4.1.9    | Angular 22 default unit-test runner (`@angular/build:unit-test`)   |
| ng-packagr              | 22.0.0   | library build (CLI default for `ng-lib`)                          |
| Prettier                | 3.9.1    | shipped by `ng new` in Angular 22                                  |
| ESLint                  | 10.6.0   | installed by `ng add @angular-eslint/schematics`                  |
| angular-eslint          | 22.0.0   | matches Angular 22 (dist-tag `latest`)                            |
| typescript-eslint       | 8.60.1   | pulled in by angular-eslint 22                                    |
| @eslint/js              | 10.0.1   | pulled in by angular-eslint 22                                    |
| eslint-config-prettier  | 10.1.8   | latest; `/flat` export for ESLint flat config                    |
| jsdom                   | 28.1.0   | Vitest DOM environment (CLI default)                              |

Note on Node: Angular CLI 22.0.4 requires `^22.22.3 || ^24.15.0 || >=26.0.0`. The machine's prior
LTS (22.15.1) was below the 22.x floor, so the latest LTS (Node 24.18.0) was installed via nvm —
which `.nvmrc` (`lts/*`) already points at. `package.json` ranges are pinned to exact versions per
the project rule "pin versions, never floating".

### Decisions and their public derivation

- **Workspace shape** — `ng new --no-create-application` to get an empty workspace, then
  `ng generate library common` + `ng generate application admin|app`. Standard Angular multi-project
  workspace layout. → Angular docs, "Multiple projects" / workspace configuration
  (https://angular.dev/reference/configs/workspace-config).
- **`common` consumed via path mapping** — `ng generate library` auto-adds the
  `compilerOptions.paths` entry `"common": ["./dist/common"]` to the root `tsconfig.json`; `admin`
  and `app` import the library by its name `common`. → Angular "Creating libraries"
  (https://angular.dev/tools/libraries/creating-libraries). Kept the CLI default (maps to the built
  `dist/common`); `npm run build` builds `common` first so the apps resolve it.
- **Zoneless (no Zone.js)** — `ng generate application --zoneless` (default `true` in v22): no
  `zone.js` dependency, no `zone.js` polyfill, change detection driven by signals. → Angular
  "Zoneless" guide (https://angular.dev/guide/zoneless).
- **OnPush by default** — Angular 22 makes OnPush the framework default; generated components carry
  no explicit `changeDetection`, and the old eager strategy is the opt-in `Eager`. → project
  `docs/conventions.md` + Angular 22 change-detection defaults.
- **Vitest** — `--test-runner vitest` is the Angular 22 default; all three projects use the
  `@angular/build:unit-test` builder. Smoke-checked: `ng test common` → 1/1 passing. → Angular
  "Unit testing" (https://angular.dev/guide/testing).
- **Standalone + built-in control flow** — `--standalone` default `true`; no NgModules. → Angular
  Style Guide (https://angular.dev/style-guide).
- **Selector prefix `nb`** — custom element/attribute prefix `nb` (nobilis) for all three projects,
  enforced by `@angular-eslint/component-selector` / `directive-selector`. → Angular Style Guide
  (custom prefix recommendation).
- **Stylesheets: SCSS** — `--style scss` for the applications; chosen ahead of the milestone-03
  PrimeNG/theming work. CLI default would be CSS; SCSS is a superset and adds no runtime cost.
- **File naming: 2025 style guide** — CLI default `--file-name-style-guide 2025` (e.g. `app.ts`,
  no `.component` suffix). → Angular Style Guide (v22).
- **Prettier + eslint-config-prettier** — Prettier is the formatter (config shipped by `ng new`:
  `printWidth 100`, `singleQuote`, Angular HTML parser). `eslint-config-prettier/flat` is appended
  **last** in the root `eslint.config.js` so it disables ESLint rules that conflict with Prettier.
  → eslint-config-prettier README (flat-config installation).
- **EditorConfig** — root `.editorconfig` (CLI-generated) with `end_of_line = lf` added to match
  `docs/conventions.md` (utf-8, LF, 2-space indent, trim trailing whitespace, final newline). →
  EditorConfig spec (https://editorconfig.org).
- **Prettier scope** — `.prettierignore` excludes build output (`dist`, `coverage`, `.angular`),
  the lockfile, and authored prose (`CLAUDE.md`, `docs/`) so the formatter owns the engine code,
  not hand-formatted documentation (consistent with the `.editorconfig` `[*.md]` rules).

### Verification (Definition of Done)

- `npm run build` (builds `common`, `admin`, `app`) → all green.
- `npm run lint` (`ng lint` over all three projects) → "All files pass linting."
- `npm run format:check` (`prettier --check .`) → "All matched files use Prettier code style!"
- `ng test common --watch=false` → 1/1 passing (Vitest runner confirmed).

No business logic, no UI library (PrimeNG deferred to milestone 03), no domain screens.

## 2026-06-28 — Secret-scan gate (gitleaks)

Discipline is not a control: a real secret nearly reached a committed file in the paired backend
repo. A machine barrier now enforces "no key/secret/token value in any committed file" — mirrored
across both repos.

- **gitleaks** (8.30.1, pinned) as the secret scanner — https://github.com/gitleaks/gitleaks.
- **Pre-commit hook** — `.githooks/pre-commit` runs `gitleaks git --staged` (fail-closed: no gitleaks
  on PATH → commit refused). Enable once per clone: `git config core.hooksPath .githooks`.
- **CI** — required GitHub Actions job `.github/workflows/secret-scan.yml` runs `gitleaks dir .`
  before merge to `dev`.
- **Config** `.gitleaks.toml` — extends the default ruleset + a rule for a Base64 256-bit value
  assigned to a secret-ish property; allowlists `*.example` samples, `${ENV}` placeholders, and
  `node_modules`/`dist`/`target`. Identical to the backend config (one rule set, both repos).
- **Demonstrated** — a planted key blocks the commit (HEAD unchanged); the clean tree passes.

Rule recorded in `CLAUDE.md` ("Secrets — never hardcode keys"). No secret value is recorded here.

## 2026-07-02 — Milestone 03, pass 1: admin vertical slice (PrimeNG login → guard → dashboard)

First rendered screens: a PrimeNG-themed admin login (Signal Forms) that authenticates against the
backend admin host, stores the thick token, guards a dashboard route, and is exercised end-to-end by
Playwright. PrimeNG connects here (deferred from milestone 00 as planned). Zoneless, OnPush, and
signals throughout.

### Decisions and their public derivation

- **PrimeNG 21.1.9 on Angular 22 via `--legacy-peer-deps`** — the latest PrimeNG (21.1.9,
  `package.json:28`) still peers `@angular/common ^21` only; Angular 22 is ~3 weeks old and no
  Angular-22 peer is published yet. Installed with `--legacy-peer-deps`; `@angular/cdk` is pinned to
  `21.2.14` (`package.json:19`) because that CDK's peer already allows Angular 22 **and** satisfies
  PrimeNG 21's `cdk ^21`. It **compiles (AOT) and runs** — the login page renders and an interactive
  submit is proven by the Chromium e2e. Revisit when PrimeNG ships an Angular-22 peer. → PrimeNG
  installation docs; npm peer-dependency resolution.
- **Theme package is `@primeuix/themes`, not `@primeng/themes`** — `providePrimeNG({ theme: { preset:
  Aura } })` + `provideAnimationsAsync()` (`app.config.ts:14-16`), importing `Aura` from
  `@primeuix/themes/aura` (`:5`). Doc-drift noted: `CLAUDE.md` said `@primeng/themes` (stale — the
  theming packages were renamed to `@primeuix/*`); trusted the live PrimeNG docs over the local doc.
  → PrimeNG v20 theming docs (context7).
- **Signal Forms (`@angular/forms/signals`) works under Angular 22** — `form(model, path => {…})`
  with `required`/`email` validators (`login.ts:2,31`) and the `[formField]` directive bound to
  native inputs (`login.html:6,20`). The AOT compiler enforces its rules (NG8022 forbids a `name`
  attribute on a `[formField]` node — removed). Runtime submit proven by e2e flow 2. → Angular
  Signal Forms guide (context7).
- **`p-password` not used — deterministic `pInputText` path** — `[formField]` × PrimeNG-CVA interop
  is unverifiable at build time, so the password field is a plain `<input pInputText type="password">`
  (`login.html:16-21`) that binds to Signal Forms for certain — NOT a fall back to Reactive Forms.
  `p-password` can be trialed now that the e2e harness exists — recorded as optional debt. → Angular
  Signal Forms + PrimeNG InputText docs (context7).
- **Zoneless is the Angular 22 default** — no `provideZonelessChangeDetection` (that is the obsolete
  v20 idiom) and no zone.js. `provideAnimationsAsync()` (PrimeNG needs it) required installing
  `@angular/animations@22.0.4` (`package.json:18`), which the zoneless scaffold omits. → Angular
  zoneless guide (context7): "zoneless is the default in v21+".
- **Dev transport + token storage** — the Angular dev proxy forwards `/auth` → the admin host on
  `:8080` (`proxy.conf.json:2-3`), so no CORS on the backend. The token lives in a signal mirrored to
  **`sessionStorage`** (tab-scoped, cleared on close), NOT `localStorage` (`auth-store.ts:21,25,50`);
  a functional `CanActivateFn` redirects unauthenticated navigation to `/login`. → Angular CLI proxy,
  `provideHttpClient`, and router-guard docs (context7).
- **Playwright e2e, backend-optional** — `@playwright/test` with a `webServer` that starts
  `ng serve admin`. The anonymous→login flow always runs (no backend); the credentialed
  login→dashboard flow `test.skip`s unless `NOBILIS_E2E_ADMIN_*` env is set
  (`e2e/admin-login.spec.ts:14-16`), so the suite stays green locally/CI without a backend. → Playwright
  test + `webServer` docs (context7).

### Verification (Definition of Done)

- `npm run build` (prod, all three projects), `ng lint admin`, `ng test admin` (Vitest), and
  `prettier --check .` → all green.
- Playwright: the anonymous→login flow passes live in Chromium; login→dashboard skips without
  `NOBILIS_E2E_*` creds + a running backend.
- All added dependencies pinned to exact versions (no floating ranges), per project rule.

### Debt (for later passes)

- PrimeNG↔Angular-22 peer gap (`--legacy-peer-deps`); trial `p-password` on the e2e harness; the
  `?locale=` transport is not wired yet (front has no i18n mechanism; UI strings are centralised in
  per-feature `*.strings.ts` constants pending milestone 05).

## 2026-07-02 — Milestone 03, pass 2: TS6 rootDir

- **Explicit `"rootDir": "./src"`** in every project tsconfig (`admin`/`app`/`common`, the
  `*.app`/`*.spec`/`*.lib` variants) — TypeScript 6 no longer infers the common source directory and
  warns until `rootDir` is set explicitly. Setting it to the value TS already inferred silences the
  warning class repo-wide with no change to the emit/output layout (`ng build` unaffected). →
  TypeScript 6 `rootDir` migration guidance.
