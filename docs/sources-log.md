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
