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
- **`.npmrc` with `legacy-peer-deps=true` (repo root)** — the peer gap above was only bridged by a
  manual `--legacy-peer-deps` flag on local installs, so CI (`.github/workflows/ci.yml:25`, plain
  `npm ci`) hit `ERESOLVE` on `primeng@21.1.9`→`@angular/common ^21`. Committing the flag as project
  config makes every environment resolve identically without a per-command flag. Remove together with
  the `--legacy-peer-deps` note above once PrimeNG ships an Angular-22 peer. → npm `.npmrc` config docs.
- **admin `initial` budget raised `1MB`→`1.5MB` error (`500kB`→`1.25MB` warning), prod config only**
  (`angular.json:73-74`) — after the `.npmrc` fix, CI reached the next red step: the admin prod bundle
  is `1.20 MB` initial (grown by the accounts/roles screens), over the default `1MB` error. Conscious
  trade: raise the ceiling, do **not** lazy-split / pull PrimeNG out of the initial chunk yet (the
  correct long-term fix — a separate ticket). The limit is set **explicitly just above the real weight**
  (warning `1.25MB` still fires on the next regression), not padded "forever", so the budget keeps
  catching growth — a visible gesture for a showcase engine, not a silent bump. `app` (initial
  `188 kB`) and `common` (no budget) are unaffected. Provenance = this CI budget-gate failure (step 2/2
  of the CI-green pass). → Angular CLI size-budgets docs (context7: `initial` = Initial Total,
  `maximumWarning`/`maximumError`, kb/mb units).
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

## 2026-07-03 — Milestone 03, pass 3b: generic CRUD front components (front-common library)

First real code in `projects/common`: a thin, schema-friendly generic CRUD kit — a table, a form, a
dialog opener, and the HTTP contract mappers the admin settings screen (pass 3c) will consume.
Feature-first under `lib/` (`http/pageable`, `http/problem`, `crud/table`, `crud/form`,
`crud/dialog`). Thin + as-data: components take field/column CONFIG, no metadata engine; custom
cells/fields are plain Angular via template outlets (composition over configuration).

### Decisions and their public derivation

- **A library that imports PrimeNG / Signal Forms declares them as `peerDependencies`, not deps** —
  `projects/common/package.json` peers `@angular/forms`, `primeng`, and `rxjs` alongside the existing
  `@angular/{common,core}`. ng-packagr treats any imported package that is neither a dep nor a peer
  as unresolved; peers (not deps) so the host supplies ONE copy (no duplicate Angular/PrimeNG). CDK
  is not peered directly — it is PrimeNG's own transitive peer, provided by the app. Proven: `ng build
  common` (partial-compilation library build) is clean, and an admin smoke spec importing the public
  surface from `common` type-checks. → ng-packagr library packaging (peerDependencies); PrimeNG 21
  `package.json` peer set.
- **Generic form = Signal Forms ARRAY-MODEL, exactly as recon predicted** — the model is an array of
  field records (config + value together); one static schema fits any field list via `applyEach`, and
  each item's `required` is read per-item with `applyWhen(({valueOf}) => valueOf(item.required))`.
  This sidesteps the injection-context/timing trap of a config-derived schema: `form()` stays a plain
  field-initializer over one signal and never needs the config at construction. Two build-surfaced
  refinements: (1) the `required` model property is NON-optional — Signal Forms types an OPTIONAL
  model property as a "maybe" path that a schema cannot read (`MaybeSchemaPathTree`), so it must be
  present (`false` for optional fields); (2) `[formField]` on a native input is typed by the control
  (text→`FieldTree<string>`, number→`FieldTree<number|null>`, checkbox→`FieldTree<boolean>`), so a
  heterogeneous union value needs typed accessor casts to bind. Only native inputs carry `[formField]`
  (the `pInputText` path proven in pass 1), not PrimeNG form controls (CVA↔Signal-Forms interop
  unverified). Verified by a jsdom component test: builds from config, blocks save while a required
  field is empty then emits once filled, and maps server errors per field. → Angular Signal Forms
  guide (`form`, `applyEach`, `applyWhen`, `FieldTree`) via context7.
- **Table = `p-table` with columns-as-data, client by default, lazy-ready** — `[columns]` drives
  `#header`/`#body`; client-side paginate/sort over `value` by default; set `lazy` and the component
  maps PrimeNG's `TableLazyLoadEvent` to Spring pageable params and emits them. Custom cells via an
  `nbColumnCell` template escape hatch (row is the implicit context). A jsdom test proves
  columns-from-config render, the custom cell projects, and the initial lazy load emits `page 0,
  size 10`. → PrimeNG Table dynamic-columns + lazy (`onLazyLoad`) docs (context7 v20; API stable to
  21).
- **PagedModel wire shape mirrors the backend, read from its test (not guessed)** — `PagedModel<T>` =
  `{ content: T[], page: { size, number, totalElements, totalPages } }`, the Spring Boot 4
  `org.springframework.data.web.PagedModel` serialization; taken from the back
  `SettingsCrudIntegrationTest` assertions (`$.content`, `$.page.size`, `$.page.totalElements`).
  Pageable request is the mirror: zero-based `page` (= `first / rows`), `size`, and `field,(asc|desc)`
  `sort` entries. → back repo `SettingsCrudIntegrationTest`; Spring Data `PagedModel`.
- **RFC 9457 consumed as a parser + opt-in interceptor** — `parseProblemDetail` extracts a typed
  `{ title, status, detail, fieldErrors? }` from an `HttpErrorResponse` (content type
  `application/problem+json`, or a structural `status`-number fallback); `fieldErrorsByKey` indexes
  it for per-field form display; `problemDetailInterceptor` is an OPT-IN functional interceptor
  (register via `withInterceptors`) that rethrows a typed `ProblemDetailError` — never global by
  default (engine opt-in principle). → RFC 9457; the back `GlobalExceptionHandler` `fieldErrors`
  shape.
- **Dialog opener is a thin convenience, and PrimeNG's `DialogService` is NOT root-provided** —
  `CrudDialog.open(component, config)` forwards to `DialogService.open` and returns the close result
  as an Observable, guarding the `DynamicDialogRef | null` return with `EMPTY`. It is `@Injectable()`
  (NOT `providedIn: 'root'`) because `DialogService` itself is not root-provided, so a consumer
  provides the pair together — verified by reading PrimeNG's dynamicdialog types. → PrimeNG
  DynamicDialog `DialogService`.
- **No hardcoded UI strings in the library** — every label/message (columns, field labels, submit /
  cancel, required messages) comes from the caller's config; the library ships zero display text, the
  seam a later i18n pass localises. Escape hatches (`nbColumnCell`, `nbFieldTemplate`) are exercised
  in the component tests.

### Verification

- `ng build common` (library) + `npm run build` (all three projects) green; `ng lint` green across
  common/admin/app; `prettier --check` clean.
- Vitest: 16 library tests (pageable mapper, problem parser, table-from-config + lazy mapping + custom
  cell, form-from-config + required + server errors + custom field) + an admin smoke-import spec, all
  green. Component tests run in jsdom; no e2e here (e2e stays in the admin app, pass 3c).
- One lint fix surfaced: an output named `cancel` collides with a native DOM event
  (`@angular-eslint/no-output-native`) → renamed `cancelled`.

### Debt (for later passes)

- Number/checkbox `[formField]` binding compiles and the form validates, but runtime coercion for
  non-text inputs is unproven here (settings 3c uses text/password/checkbox) — confirm in 3c's live
  screen. `CrudDialog` + `DialogService` wiring is import-verified only; real dialog hosting lands in
  3c.

## 2026-07-03 — Milestone 03, pass 3c: settings screen (first CRUD-kit consumer)

The admin app's `settings/` feature — the first real screen built on the pass-3b CRUD kit and the
first consumer of the pass-3a `/admin/api/settings` backend. It closes the loop the two prior passes
opened: the generic table/form/dialog + HTTP contract, now driven by a concrete, typed model.

### Decisions and their public derivation

- **Typed model path, not the generic config array** — the Setting shape is known (`key`, `value`,
  `secret`), so `SettingsApi` and `SettingFormDialog` speak concrete types; the field-config array
  (the generic escape hatch) is reserved for unknown-shape screens. → package-by-feature cohesion
  (a feature owns its concrete model); the CRUD kit stays generic while its first consumer is
  specific.
- **A DynamicDialog wrapper hosts the generic form** — PrimeNG's `DialogService` instantiates a
  component and passes `config.data`, so it does not wire a hosted component's `@Input`/`@Output`.
  `SettingFormDialog` is that thin host: it injects `DynamicDialogConfig` (create vs edit seed) and
  `DynamicDialogRef` (close with the saved row), renders `<nb-generic-form>`, and OWNS the write so a
  `400` keeps the dialog open and feeds `fieldErrors` back into the form (closing only on success).
  → PrimeNG DynamicDialog "Passing Data" (config data + `DynamicDialogRef` lifecycle), verified via
  context7.
- **Secret masking honours the backend contract** — a secret row's value arrives `null` (masked at
  the source, pass-3a `SettingDto`), rendered as a lock `p-tag` ("Hidden"), never a decrypted-looking
  placeholder and never the literal `"null"`; the `secret` flag drives a warn `p-tag` badge. A
  non-secret value renders as-is, an unset one as an em-dash. → pass-3a decision "OMIT the value
  (null), not a `••••` placeholder" mirrored on the read path.
- **Secret edit is honest about PUT semantics** — recon of `SettingsService.set` confirmed PUT
  UNCONDITIONALLY overwrites the value (no keep-existing-if-blank). So the edit form starts the value
  EMPTY for a secret (its plaintext is never returned) and an inline hint states plainly that saving
  overwrites — an empty save clears the secret. → back `SettingsService.set` (create-or-replace), not
  guessed.
- **Auth interceptor added (gap found in GATE-0)** — the app attached no token (the dashboard had no
  data call); `/admin/api` is behind the servlet gate (`JwtAuthenticationFilter` reads
  `Authorization: Bearer`). `authInterceptor` stamps the token on `/admin/api` requests only (the
  login path carries none). Registered alongside the pass-3b `problemDetailInterceptor` via
  `withInterceptors`. → back `JwtAuthenticationFilter` bearer contract.
- **Reuse over hand-rolling** — the screen composes `GenericTable`, `GenericForm`, `CrudDialog`, and
  the `PageableQuery`/`PagedModel`/`ProblemDetail` mappers; the only new UI is the settings-specific
  cells (masked value, secret badge) via the `nbColumnCell` escape hatch. Delete uses PrimeNG's
  `ConfirmationService` + `<p-confirmdialog>`. All strings live in `settings.strings.ts` (no
  hardcoded display text). → project rule "reuse shared components; i18n in the same change".

### Verification

- `ng build common` + `ng build admin` (dev, full AOT) green; `ng lint admin` green;
  `prettier --check` clean. One type fix: `PagedModel.content` is `readonly`, copied into the mutable
  rows signal (`[...page.content]`).
- Vitest: a `SettingsPage` component test asserts the masked value cell renders the "Hidden" tag +
  secret badge and never leaks the plaintext or a `"null"` placeholder (3 admin specs green).
- Playwright (live, dev server + the real backend gate): anonymous `/settings` → `/login` (guard);
  authenticated, the screen mounts and `GenericTable` renders (columns, sort, paginator, actions);
  the lazy load fires `GET /admin/api/settings?page=0&size=10` (pageable mapping correct), the proxy
  routes `/admin/api`, and the request carries `Authorization: Bearer …` (interceptor verified in the
  request headers) — the gate `401`s the fake token, as it should. Dashboard → Settings nav routes;
  the create dialog opens with the typed Key/Value/Secret fields and Save is gated by the required
  key until filled. The full create→edit→delete round-trip against a seeded DB is the credentialed
  e2e spec (`admin-settings.spec.ts`), which skips without `NOBILIS_E2E_*` so the suite stays green
  without a backend.
- Ride-alongs (flagged): `proxy.conf.json` extended with `/admin/api`; `package.json` `start` →
  `ng serve admin` (multi-project workspace).

## 2026-07-03 — Harness: physical branch-discipline hooks, reviewer subagent, context-economy + prune

Adopted Claude Code best-practices (code.claude.com/docs/en/best-practices) as concrete barriers:
- **Branch discipline → physical git hooks**, not Claude-settings hooks: `.githooks/pre-commit`
  main-guard + new `.githooks/pre-push` (blocks a push whose destination ref is `main`, and a push
  while the current branch's upstream ≠ `origin/<same-name>`; the first `push -u` is allowed). A git
  hook gates the human too, so the rule can't be bypassed by editing agent settings.
- **Reviewer subagent** (`.claude/agents/reviewer.md`) — fresh-context adversarial diff-vs-DoD check
  before the commit gate (output-side premise-check, mirrors recon's evidence-per-claim discipline).
- **Context economy** — exploration runs in the `recon` subagent returning a compressed `file:line`
  summary; window-fill degrades everything (the guide's #1 thesis).
- **CLAUDE.md prune** — Angular-22 verification rules → on-demand skill
  (`.claude/skills/angular22-verification/`); load-bearing rules kept; scattered DoD criteria
  consolidated into one "Default DoD". Bar for keeping a line: "would removing it cause a mistake?"

## 2026-07-04 — Admin: roles management screen (M03 pass 4c) on the CRUD kit

Second screen on the common CRUD kit (after settings): `roles/` feature in the admin app —
`RolesApi` (`/admin/api/roles`, `PagedModel`/`PageableQuery`, catalog at `/permissions`), a
`GenericTable` list (code, name, permission chips) and a `RoleFormDialog` (`GenericForm` +
`CrudDialog`). Mirrors the settings feature structure. Rows are addressed by numeric `id` (unlike
settings' string `key`), matching the backend `RoleController` `/{id:\d+}` paths.

- **PrimeNG `p-multiSelect` (v21.1.9) via the field-template escape hatch — the multiselect verdict.**
  The kit's `GenericForm` binds only NATIVE inputs with Signal Forms `[formField]`; PrimeNG
  form-control CVA × Signal Forms interop is unverified, so the permissions field is the
  `nbFieldTemplate` escape hatch (composition, zero kit changes). GATE-0 finding against the
  installed typings (`node_modules/primeng/types/primeng-multiselect.d.ts`): `MultiSelect extends
  BaseEditableHolder implements ControlValueAccessor` and has **no `value` input** — so the planned
  "`[(value)]`" does not exist. The clean plain-binding path is classic-forms **`[ngModel]` +
  `(ngModelChange)`** (FormsModule) feeding a `signal<string[]>`, `[options]` from the catalog
  (primitive strings → each is its own label+value → the model is `string[]`). Verdict: **binds
  cleanly** — verified in a real zoneless browser (playwright, API route-mocked): options render
  from the catalog, selections reach the POST/PUT bodies, an edit dialog is pre-populated from the
  role's permissions (display binding via `[ngModel]="permissions()"`), and the immutable `code` is
  disabled on edit and never sent on PUT. **Promotion into the kit (option a) stays deferred**: what
  we proved is the ngModel escape hatch, NOT `[formField]` × PrimeNG CVA — that interop remains
  untested and quarantined until explicitly validated. Ref: Angular `ControlValueAccessor` / `ngModel`
  two-way for signals (`[ngModel]="s()" (ngModelChange)="s.set($event)"`, since a banana-box can't
  assign to a signal). PrimeNG MultiSelect docs (primeng.org) for `options`/`display`/`inputId`.
- **Error surfaces.** Backend maps `RoleConflictException` → `409` and `UnknownPermissionException`
  → `400`, both `ProblemDetail.forStatusAndDetail(...)` with a top-level `detail` and NO
  `fieldErrors` (bean-validation `400`s carry `fieldErrors`). So the dialog shows a form-level
  message from `problem.detail` when `fieldErrors` is empty, and per-field messages otherwise; a
  blocked delete (`409` "assigned to N account(s)") surfaces as a PrimeNG toast on the list page.
- **Verification.** `ng build admin` (AOT, `roles-page` lazy chunk) + `ng lint admin` + `ng test
  admin` (4 specs incl. a `RoleFormDialog` test: options fed from a catalog, selected values reach
  the create request) all green. Live playwright: guard redirect, table + chips, create (dialog,
  multiselect options, required-gated Save, correct POST), edit (disabled code, pre-populated
  multiselect, PUT without `code`, addressed by id), and the `409`-delete toast. The credentialed
  e2e spec (`e2e/admin-roles.spec.ts`) skips without `NOBILIS_E2E_*` so the suite stays green
  without a backend.
- **e2e selector lesson — open a `p-multiSelect` via its VISIBLE trigger, not the hidden input.**
  Binding `[inputId]="key"` puts that id on PrimeNG's hidden focus input
  (`data-pc-section="hiddeninput"`, `role="combobox"`, `sr-only`), so a Playwright
  `page.locator('#key').click()` waits forever ("element is not visible/stable") and times out.
  Reproduced + confirmed against the v21.1.9 DOM (context7 + a headed run): click the visible host
  (`page.locator('p-multiselect')`) to open the panel; options render in a body-level overlay, so
  page-scoped `getByRole('option')` finds them. Product code was correct — a test-only selector fix.
  The accounts screen (4e) uses the same pattern, so target the trigger there too.

## 2026-07-04 — Admin: accounts management screen (M03 pass 4e) on the CRUD kit

Third screen on the common CRUD kit (after settings + roles): `accounts/` feature in the admin app —
`AccountsApi` (`/admin/api/accounts`, `PagedModel`/`PageableQuery`), a `GenericTable` list (id,
status badge, realms/roles/identities chips) and an `AccountFormDialog` (`GenericForm` +
`CrudDialog`). Mirrors the roles feature. Manages EXISTING accounts only — no create, and no delete
verb (soft-delete = choosing `BLOCKED` in the status field, per the 4d contract).

- **THREE escape-hatch controls, all `nbFieldTemplate` + plain `[ngModel]`/`(ngModelChange)`→signal
  (NOT `[formField]`).** The 4c multiselect verdict extended: a PrimeNG `p-select` (status) + two
  `p-multiSelect`s (realms static enum, roles fetched). Verified against the v21.1.9 typings that
  `Select extends BaseInput implements ControlValueAccessor` with plain `options`/`optionLabel`/
  `optionValue` inputs — the same escape-hatch shape as `MultiSelect`; the Signal-Forms × PrimeNG
  CVA interop stays quarantined. **Kit-gap noted:** the kit's `FormFieldType` has no `'select'`, so
  status could not be a built-in field — hence all three go through the outlet (zero kit changes; a
  `'select'` built-in could be promoted later, out of scope). Roles bound **by id**
  (`optionValue="id"`, model `number[]`) per the 4d update contract; realms by enum name.
- **Model vs update shape — the first front consumer of the 4d accounts API.** `AccountModel` mirrors
  `AccountDto` faithfully, keeping `roles: RoleRef[]` (`{id,code,name}`) so the table/dialog show role
  NAMES; the update extracts `roleIds = roles.map(r => r.id)`. No `get(id)` API method — the list row
  already carries the full `AccountDto`, so the edit dialog seeds from the row (a deliberate omission
  vs the build sketch). Role OPTIONS come from the roles LIST endpoint (paged) fetched at `size=200`
  — the engine's catalog is small; a many-role domain would page. `secret_hash` never appears: the
  DTO's `IdentityRef` is `{provider, externalId}` only, so the front literally cannot render it, and
  identities are shown read-only (identity/login management is deferred).
- **Empty-list reality (config-admin has NO account row).** The configured admin authenticates with
  no `account` row (4d), so a fresh database lists ZERO accounts — the normal state, not an error.
  The screen renders an explanatory empty-state (`loaded() && totalRecords() === 0`, a `loaded`
  signal so it never flashes before the first load). **This drove the e2e decision:** with no create
  path on this screen, a self-contained credentialed spec cannot seed a row to mutate, so
  `e2e/admin-accounts.spec.ts` is minimal — an always-on anonymous→login guard test plus a
  credentialed mounts+list-renders test (skips without `NOBILIS_E2E_*`); the status/realms/roles
  mutate round-trip waits for account creation (a later milestone) and is proven instead by a
  component test + a route-mocked live playwright run.
- **Verification.** `ng build admin` (AOT, `accounts-page` lazy chunk) + `ng lint admin` + `ng test
  admin` (6 specs incl. two accounts specs: the three controls render options + correct PUT body;
  the empty-state renders) all green. Live playwright (route-mocked, no backend): guard redirect;
  table with status badge + chips (identity chip shows the provider only); the edit dialog's status
  select (3 values), realms multiselect (ADMIN/CLIENT), roles multiselect (fetched, by name),
  read-only identities; `PUT /admin/api/accounts/7` body `{status:"BLOCKED", realms:["ADMIN","CLIENT"],
  roleIds:[1,2]}` (roles by id, realms by name); dialog closes + list reloads; and the empty-state
  when the list is empty. Multiselect e2e targets the visible `p-multiselect`/`p-select` trigger, not
  the hidden `inputId` input (the 4c lesson).

## 2026-07-04 — Harness: Claude Code format + verify hooks (fullstack, both repos)

Fullstack #2 of the hooks/context-hygiene series (the `2026-07-03` entry above was #1 — physical
git hooks). Turns the advisory format/verify CLAUDE.md rules into deterministic tool-call barriers.

- **Two Claude Code hooks, committed in `.claude/settings.json` of BOTH repos** (merged next to
  `permissions`, never replacing them): a **PostToolUse** per-file formatter and a **Stop** full-verify.
  The shared scripts (`.claude/hooks/format-file.sh`, `verify-on-stop.sh`) are **byte-identical** across
  the two repos — only the session-root repo's hooks fire, but either repo can be root, so both carry them.
- **No PreToolUse boundary hook** (unlike the abandoned single-repo sketch). A fullstack session
  legitimately writes both trees, so a "deny outside `$CLAUDE_PROJECT_DIR`" barrier would block the
  workflow; engine/domain + sibling-read-only boundaries stay on the `.githooks/` layer (pre-commit /
  pre-push) + CLAUDE.md prose. Only the `recon` subagent is read-only on the sibling, not the main session.
- **PostToolUse format dispatches by extension** — `*.ts/*.tsx/*.html/*.scss/*.css` → the repo's
  `node_modules/.bin/prettier`; `*.java` → a standalone google-java-format jar (back-only, gitignored
  `.claude/tools/`). Side-effect only; a formatter error NEVER fails the edit. `*.md/*.json` deliberately
  excluded so the methodology/sources docs are never churned (and the byte-identical invariant holds).
- **Stop = full verify of every dirty tree, block-once** — front dev-AOT build of `common`/`admin`/`app`
  (`ng build … --configuration=development`) + one-shot `ng test … --no-watch`; back `mvn -B verify`.
  Each tree is skipped when clean (porcelain-scoped); blocks exactly once (`stop_hook_active`) so a
  persistently red build surfaces and stops, never loops.
- **Provenance:** current Claude Code hooks docs (code.claude.com/docs/en/hooks). **Doc-drift caught in
  recon:** a subagent claimed "hooks fully override lower scopes" — FALSE; hooks AGGREGATE across
  user/project/local scopes (recorded so it isn't repeated).
- **Traps proven empirically before shipping** (back side): google-java-format 1.35.0 rejects the `--`
  filename separator (`unexpected flag: --`), and it needs a JDK ≥ 21 (`NoClassDefFoundError:
  JCTree$JCAnyPattern` under the box-default JDK 17) plus five `jdk.compiler --add-exports` — so both
  hooks resolve a JDK ≥ 21 portably ($JAVA_HOME → newest sdkman candidate → PATH; no hardcoded path).

## 2026-07-07 — Methodology backport + front canon becomes a pointer (SSOT in back)

Eight durable prompting/diagnosis lessons from sibling projects — accumulated past the current
recon-first canon — were folded into the canon as living-standard extensions (the canon invites
"extend as new patterns prove out"), rewritten in English and project-agnostic (no external-project
literals — pattern only, clean-room). The canon edit lands in the **back** repo
(`nobilis-platform-back/docs/process/prompting-methodology.md`); its full provenance row is in the
back `sources-log.md`.

### Front-specific structural change

- **`docs/process/prompting-methodology.md` is now a thin POINTER**, not a full byte-identical copy.
  The canon is single and lives in the back repo (the portable layer, shared by both repos); the
  front file references it (a relative sibling link + the repo-named path) and holds only
  front-specific lessons if any arise. This adopts the SSOT model (edit a shared rule once in back),
  replacing the prior "byte-identical in both repos" invariant for this one file — a copy would drift
  from the canon.
- **Caveat (relative link):** the sibling link resolves only when both repos are checked out side by
  side; a standalone clone of the front repo (or the GitHub web view) will not follow it, but the
  repo-named path in the pointer text still identifies the canon unambiguously.

### Folded rules (summary; full text in the back canon)

Deterministic gates as hooks; deployment-requirements (a `## Deployment requirements` contract
table + the prod config-mechanism as a GATE-0 evidence class + a live process start as a DoD item —
"a green build ≠ a running process"); questions-gate-the-prompt hardened for HEAVY/config/deploy;
the portable layer is project-agnostic; KISS (recon is not the default); anti-overhead (a locked
plan → command directly); branch base = the dependency's location; editing shared/base code =
HEAVY with GATE-0 asking WHY. **Deliberately dropped:** a source rule premised on "the main line =
auto-deploy to clients" — contradicts model C (main merges freely; release = manual `mvn deploy`);
only its portable branch-topology core was kept.

---

## 2026-07-09 — Portal: first real route (M03, app-host-boot)

The `app` portal gets its first route — a static `Landing` placeholder at `''` plus a `**` wildcard
redirect home, mirroring the tail of `projects/admin/src/app/app.routes.ts`. Paired with the backend
pass that made the `app` host boot at all (see `nobilis-platform-back/docs/sources-log.md`).

| Decision | Source / rationale |
| --- | --- |
| The landing is STATIC — no `httpResource`, no HTTP call | Its content is CMS-driven per the milestone, and the CMS does not exist. Consuming an endpoint whose contract would be guessed ahead of its source is the speculative-infrastructure defect (BL-001's own reasoning). The backend's `/api/health` probe is deliberately unrelated: it proves the host is alive, not that this page has content. |
| `provideHttpClient` and PrimeNG stay OUT of `projects/app/src/app/app.config.ts` | Only the rejected content-endpoint option would have needed them. Adding either now would be configuration for a capability the portal does not use. `admin`'s config carries both because its screens actually call the API and render PrimeNG widgets. |
| Strings live in `landing/landing.strings.ts`, not inline in the template | Same i18n seam as every admin screen (`dashboard.strings.ts`, `settings.strings.ts`, …): user-visible text is isolated in one place so a future i18n mechanism has a single point to consume, even though this screen's content is a placeholder. |
| The shell's `<h1>{{ title() }}</h1>` was removed from `app.html` (with the now-dead `title` signal and the spec case asserting it) | Angular CLI scaffolding, harmless while `routes` was empty. Once `''` renders `Landing` — which owns its own `<h1>` — the shell's heading would print a literal "app" above every screen and give each page two `<h1>`s. Verified in the browser via playwright: one `h1`, and `/no-such-page` redirects to `/` with zero console errors. |

---

## 2026-07-12 — M05 pass 2: `common/locale` — `localStorage`, not `sessionStorage`

`LocaleStore` persists the active UI locale to `localStorage`, diverging from `AuthStore`'s
`sessionStorage` choice (`auth-store.ts:24-26,47-54`).

| Decision | Source / rationale |
| --- | --- |
| `localStorage`, not `sessionStorage`, for the locale preference | `AuthStore`'s `sessionStorage` choice was deliberately tab-scoped for a security-sensitive token (clears on tab close). A locale preference is not sensitive and a user expects it to persist across tabs and browser restarts, not reset per tab — the opposite of the auth token's threat model, so the pattern does not transfer. |

---

## 2026-07-12 — M05 pass 3: `@angular/localize` runtime init — build-order + assets-path decisions

Wiring `initI18n()` (registers locale data, loads the `$localize` overlay dictionary) into both
`admin` and `app` bootstraps surfaced two decisions worth recording before pass 4 marks strings.

| Decision | Source / rationale |
| --- | --- |
| `initI18n()` lives once in `common` (`projects/common/src/lib/locale/i18n-init.ts`), NOT duplicated per app — but `common` resolves via the `common` path alias to `dist/common` (`tsconfig.json`), not library source | Consuming projects only ever see the *built* library output. Any edit to `initI18n()` (or anything else in `common`) requires `ng build common` before `ng build admin`/`ng build app`/`ng serve` picks it up — stale `dist/common` silently serves the old behavior with no compile error. This is a standing trap for every future `common` change, not just this pass. |
| Locale dictionaries (`ru.json`/`ro.json`) live per-app under each project's `public/i18n/` (Angular 22's `public/` asset convention, not the legacy `assets/` folder), duplicated rather than served from one shared location | `angular.json` wires `public/` independently per build target with no shared-assets pipeline already in place; building one for two small JSON files ahead of actual need is the same speculative-infrastructure trap called out in the M03 pass-2 log above. Revisit only if dictionary content grows enough that duplication starts causing real drift. |
