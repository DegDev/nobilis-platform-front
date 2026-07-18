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

---

## 2026-07-12 — M05 pass 4 (final): `$localize` string marking — extract-i18n bridge + TS-side-only marking

Closes milestone 05. Marked all ~182 user-visible strings across the 9 `*.strings.ts` files with
`` $localize`:@@PascalCaseId:...` `` and wired `ng extract-i18n` for both apps.

| Decision | Source / rationale |
| --- | --- |
| `extract-i18n --format=json` output is used ONLY as the master EN id list, never written to `public/i18n/*.json` as-is | The `json` format's actual on-disk shape, confirmed from the installed `@angular/localize` package (`simple_json_translation_parser.d.ts`), is `{ locale, translations: {id: msg} }` — one wrapper level, not flat. The runtime loader (`i18n-init.ts:33`) calls `loadTranslations(await response.json())` on the raw body with no unwrap, so the served overlay files are hand-authored in the bare flat shape directly; the wrapped extract output lives under each project's `src/locale/` (gitignored, not under `public/`) purely as a build artifact to read `.translations` keys from. (The initial stub shape shipped here — `{id: ""}` for every id — was wrong; corrected the same day, see the pass-4 follow-up entry below.) |
| Master extraction format = `json`, not XLIFF, despite XLIFF carrying source-location metadata | `ru`/`ro` are empty stubs this milestone with no live translator process — XLIFF's per-string source-file/line comments are weight with no consumer yet (extract-don't-predict, same reasoning as BL-001). Revisit only once a real translation handoff workflow exists. |
| Marking is entirely TS-side (`$localize` tagged template literals inside `.strings.ts`), not the template `i18n="@@Id"` attribute | Recon (pass-4 recon) found the ~182-string surface is consumed via property binding (`{{ strings.title }}`, `[label]="strings.submit"`), not literal template text nodes — `login.html:2,5,15,30,35` confirms the pattern repo-wide. The template-attribute extraction path has near-zero surface here; documented so a future contributor doesn't go hunting for `i18n=` attributes that were never going to exist. |
| Same-text-same-meaning strings share one `$localize` id across files (e.g. `@@Save`, `@@Cancel`, `@@Status`, `@@BackToDashboard`) rather than a fresh id per screen | Flat, no-feature-prefix namespace (locked decision) makes this the natural dedup point; `ng extract-i18n` also *requires* it — it errors on the same id with different source text, so consistent reuse of common UI words was verified duplicate-id-safe by the extract run itself (179 raw uses → 106 unique admin ids, 0 conflicts). |
| Vitest overlay-integrity spec (`i18n-overlay.spec.ts` per app) reads `public/i18n/ru.json`/`ro.json` via `node:fs`, requiring a new `@types/node` devDependency + `"node"` added to each app's `tsconfig.spec.json` `types` | JSON `import` would hit the spec `tsconfig`'s `rootDir: "./src"` boundary (the overlay files live under `public/`, outside `src/`) and require `resolveJsonModule` plumbing; `fs.readFileSync` with a relative path sidesteps the rootDir constraint entirely since it's a runtime string, not a compiled import — the only actual gap was type declarations for `node:fs`/`node:path`, fixed by installing `@types/node`. |

---

## 2026-07-12 — M05 pass 4 follow-up: `{id: ""}` stubs blanked the UI — absent key, not empty value, is the EN-fallback path

Live check (Deg) showed switching to RO/RU blanked every label instead of falling back to English.
`loadTranslations` (`@angular/localize` `localize.mjs`, `loadTranslations()`) only writes
`$localize.TRANSLATIONS[key]` for keys **present** in the loaded object — it never special-cases an
empty string. So a present key mapped to `""` overrides the English source with nothing, while an
**absent** key is what leaves the `$localize` source untouched. The pass-4 stubs mapped every
extracted id to `""`, which is the wrong one of those two states. Fixed: all four overlay files now
carry 1–2 SEEDED real values only (`AdminDashboardTitle` for admin, `NobilisPlatformTitle` for app),
omitting every other id — proving both "apply" (the seeded string visibly changes) and "fallback"
(everything else stays English) in one screen. Recorded because "present-but-empty ≠ absent" is a
generic i18n-loader gotcha likely to bite again if the overlays are ever machine-generated.

---

## 2026-07-12 — M05 pass 4 follow-up #2: overlay-integrity spec read via JSON import, not `node:fs`

Deg's independent run showed `i18n-overlay.spec.ts` registering **0 tests and FAIL** in both apps,
contradicting the prior "all green" report. In this checkout, `ng test admin`/`ng test app` (default
`@angular/build:unit-test` config, no `browsers` set) ran the spec fine and it passed — the installed
builder schema (`node_modules/@angular/build/src/builders/unit-test/schema.json`, `browsers` option
description) confirms tests default to **Node.js + jsdom**, not a real browser, so `node:fs` isn't
externalized here and the discrepancy could not be reproduced locally. Flagging that mismatch rather
than silently trusting either side — but the requested fix (drop `node:fs`/`node:path`, import the
overlay JSON directly: `import ru from '../public/i18n/ru.json'`) is strictly more portable regardless
of which environment is right, so it was applied. It worked with no `resolveJsonModule` tsconfig
change needed (Vite's native JSON-module handling). Removed the now-unnecessary `@types/node`
devDependency and the `"node"` entry in both apps' `tsconfig.spec.json` `types` (grep confirmed no
other file uses `node:*` imports). General lesson kept regardless of the reproduction gap: a spec
that reads the filesystem in a Vitest project can silently register **zero tests** instead of failing
loudly if its runtime environment can't resolve the module — prefer a module import over `node:fs`
for fixture data whenever the bundler supports it.

---

## 2026-07-12 — harness: CC report contract tightened (no unverified green claims)

Directly caused by the pass-4-follow-up-#2 incident above (CC's report claimed "all green" while
`i18n-overlay.spec.ts` had silently registered 0 tests). The commit-gate paragraph + DoD line in
both `CLAUDE.md` (duplicated, not pointer-shared — confirmed byte-identical by diff after the
edit) now require, for any check actually run, the exact command **+ its raw outcome line** (a
real test-count line, not a summarized "all green"); a check not run is reported as not run,
never asserted. Judgement/findings (what/why, surprises, unresolved GATE-0 discrepancies) are
foregrounded as the report's actual value, not a proof block. Full rationale in the back canon
`nobilis-platform-back/docs/sources-log.md` (same date, "harness — CC report contract tightened").

---

## 2026-07-13 — M06 slice 5: AI/LLM admin form renders entirely from the backend descriptor

The `ai-llm` screen (`projects/admin/src/app/ai-llm/`) is the first consumer of the shared
`GenericForm`/`FormFieldState` kit (`crud/form/`, built in an earlier CRUD milestone) OUTSIDE a
`DynamicDialog` — it's embedded directly in a standalone page, proving the primitive isn't
dialog-coupled. Editable INFRA/OPERATIONAL fields map to `FormFieldState[]` at runtime from
`GET /admin/api/ai/descriptor` (`toFormField` in `ai-llm-page.ts`); labels are the raw `fieldKey`
(no per-field label dictionary) so a brand-new catalog field appears with zero frontend change —
that's the mechanism's whole point, and hardcoding labels would silently defeat it. Read-only
`editable=false` fields (e.g. `base-url`) and `SECRET`-category fields are deliberately rendered
OUTSIDE `GenericForm` (plain text / a bespoke password input showing only `secretsSet`), mirroring
the Settings/Integrations screens' write-only-secret convention — `GenericForm`'s Signal-Forms tree
only ever holds INFRA/OPERATIONAL non-secret values.

Tried and reverted: adding optional `min`/`max` to `FormFieldState` + `[attr.min]`/`[attr.max]` on
the generated `<input>` for native browser bounds. Angular's Signal Forms `[formField]` directive
rejects any `[attr.*]` binding on its host element at compile time (`NG8022`) — it owns the
element's bound attributes so its schema-driven validators stay authoritative. Reverted rather than
plumbing `min`/`max` into the Signal Forms schema (bigger, riskier change than this slice's scope);
the backend already validates and rejects out-of-bounds values (`error.ai-provider-field-out-of-bounds`),
surfaced client-side via the same top-level `formError` fallback the role/settings dialogs already
use for `fieldErrors`-less problems.

Screen is deliberately SPARTAN (plain PrimeNG defaults, native `<select>`) per the milestone's
explicit instruction — a dedicated admin design-system milestone follows 06 and will redress every
screen at once; polishing this one now would be redone work.

## 2026-07-13 — Silent token refresh: single-flight re-mint coalescing in `authInterceptor`

`AuthStore.remint()` (`projects/admin/src/app/auth/auth-store.ts`) is the repo's first instance of
request coalescing: a private `remintInFlight$: Observable<string> | null` field, with
`.pipe(map, tap, finalize(() => (this.remintInFlight$ = null)), shareReplay(1))`. Recon confirmed
zero prior precedent anywhere in the frontend (`shareReplay`/`share(`/`Subject<`/`mutex`/`inFlight`
all zero hits) — this is greenfield, not a deviation from an existing idiom.

Operator order is load-bearing: `finalize` sits BEFORE `shareReplay` in the pipe, not after. Placed
after `shareReplay` it would fire once per external subscriber's unsubscription instead of once for
the single shared HTTP call — `shareReplay` multicasts ONE upstream subscription to every caller, and
`finalize` upstream of it tears down exactly when that one shared subscription completes, which is
the single point where the "next remint cycle should start a fresh call" guard needs to reset.

`authInterceptor` (`auth-interceptor.ts`) calls `AuthStore.remint()` from two independent triggers —
proactively (token has under 5 minutes left, checked via the new `decodeJwtExp` in `jwt.ts`) and
reactively (a request already went out on an expired token and got a 401, backgrounded-tab/clock-drift
case) — both funneling through the same coalesced call, so N requests racing an expiring token during
an idle-tab wake produce exactly one backend round-trip, not N. Reactive retry is capped at exactly
one attempt: a second failure (the re-mint itself failing, meaning the backend's `loginAt`-based
staleness cap or grace window rejected it) logs out and redirects to `/login`, reusing the same
fallback `authGuard` already uses for a missing token — no new redirect path introduced.

The re-mint HTTP call targets `/auth/admin/remint`, which does NOT start with `/api/admin`, so it is
deliberately invisible to `authInterceptor`'s own `/api/admin`-prefix gate — `AuthStore.remint()` sets
the `Authorization` header itself from the token about to be replaced, rather than relying on the
interceptor (which would only stamp it for admin-api paths and could recurse back into itself).

## 2026-07-18 — M07 slice 1: sakai-ng layout shell fork — provenance and GATE-0 outcome

`.agent/plans/07-admin-design.md` locked "fork-template import from `primefaces/sakai-ng@21.0.0` +
its `sakai-assets` submodule (pinned commit), MIT" as decision 1, with an explicit GATE-0: verify
the submodule's LICENSE, STOP if not MIT. It wasn't MIT — recon found no LICENSE file in
`cetincakiroglu/sakai-assets` (the submodule's third-party owner, not PrimeTek) on any commit or
branch, and GitHub's own license-detection API reports `"license": null`. Presented to the operator
via AskUserQuestion; the chosen resolution below is operator-confirmed, not a unilateral call.

**What's actually MIT vs. what isn't.** `primefaces/sakai-ng`'s own root `LICENSE.md` (MIT, PrimeTek,
confirmed via the GitHub API — not a fork) covers everything tracked directly in that repo. The
Angular components slice 1 needs (`app.layout.ts`, `app.topbar.ts`, `app.sidebar.ts`, `app.menu.ts`,
`app.menuitem.ts`, `app.footer.ts`, `layout.service.ts`) live directly in that MIT tree at
`src/app/layout/` — sourced from commit `96d71496d685b5c110efd2875abaa2bf89a56ad2` (tag `21.0.0`).
Only the layout **SCSS** lives in the unlicensed submodule.

**Resolution:** the same SCSS (`layout.scss`, `_topbar.scss`, `_menu.scss`, `_footer.scss`,
`_core.scss`, `_main.scss`, `_mixins.scss`, `_responsive.scss`, `_utils.scss`, `_typography.scss`,
`variables/*.scss`) was tracked as regular files directly in `primefaces/sakai-ng` itself — under
that same root MIT `LICENSE.md` — up through tag `20.0.0`, before PrimeTek split it into the separate
submodule repo. Diffed both: `layout.scss` is byte-identical between MIT tag `20.0.0` and the
unlicensed submodule at `21.0.0`; `_topbar.scss` differs only by an added `.config-panel` block
(configurator styling, slice 2 scope, not ported here). The SCSS is sourced from commit
`63c55fa37037d2e8854a63408315b9ee493cb66c` (tag `20.0.0`) instead of the submodule — same MIT
grant, earlier pin. `_preloading.scss` (a bootstrap loading-spinner, no markup for it in
`index.html`) was not ported — out of the "structural shell" scope, not a licensing call.

**A second recon-premise correction, found while reading the actual `.ts` files (not asked about
separately — decisions 3 and 6, already locked, fully determine the fix).** The plan's decision 3
states the structural shell is "already Tailwind-free (recon-confirmed)". True for the SCSS and for
`app.sidebar.ts`/`app.menu.ts`/`app.menuitem.ts`/`layout.service.ts`, but **not** for
`app.topbar.ts` (`hidden lg:block`, and `pStyleClass` show/hide driven by Tailwind's `animate-scalein`
/`animate-fadeout`/`hidden` utility classes) or `app.footer.ts` (`text-primary font-bold
hover:underline`) — confirmed by grepping the ported SCSS for those class names (none defined there)
and finding `@tailwindcss/postcss` wired at the sakai-ng repo root. Fix, within the already-locked
decisions: `ShellFooter` (`projects/common/src/lib/layout/shell-footer.ts`) uses a new
`.layout-footer-link` SCSS class (plain CSS on PrimeUI tokens) instead of the Tailwind utilities.
`ShellTopbar` (`shell-topbar.ts`) drops the mobile "…" overlay panel entirely rather than re-styling
it — it only ever revealed inert demo chrome (Calendar/Messages/Profile buttons with no handlers in
this admin); the one real action that lived there, sign-out, is supplied by `AdminShell` via content
projection instead (`Shell`'s `<ng-content>` forwards into `ShellTopbar`'s). The palette/configurator
button and `<app-configurator>` embed are dropped for the same reason decision 5 already gives —
configurator is slice 2, excluded here.

**Why `Shell` mounts via routing, not the root component template.** Upstream's own `app.routes.ts`
nests `AppLayout` as a route-level wrapper (`{ path: '', component: AppLayout, children: [...] }`),
not inside the root `AppComponent`'s template. Mirrored here for the same reason it exists upstream:
the shell must wrap only the authenticated route subtree, not the (unauthenticated) `/login` screen.
This has one consequence upstream doesn't have to deal with: a route-mounted component can't receive
projected light-DOM content from a call site, so `AdminShell` (`projects/admin/src/app/shell/`) is a
thin admin-owned wrapper that instantiates `<nb-shell>` directly in its own template — `common`'s
`Shell`/`ShellTopbar` stay generic (no `AuthStore` dependency), `AdminShell` owns the concrete nav
model and the sign-out action. The locale switcher, by contrast, is baked directly into `ShellTopbar`
— `LocaleStore` is already `common` infrastructure, not admin-specific, so there is no reason to
route it through projection. The one route outside the shell, `/login`, lost the root component's
former locale switcher when `app.ts`/`app.html` were simplified to a bare `<router-outlet>` — it
now carries a small switcher of its own (`login.ts`/`login.html`), same `LocaleStore` call, ~5 lines
duplicated rather than a cross-cutting abstraction for two call sites (three-similar-lines-beats-a-
premature-abstraction).

**Admin menu labels reuse existing translated strings, not new ones.** `admin-menu.ts`
(`projects/admin/src/app/shell/`) labels each sidebar entry with its target screen's own already-
`$localize`'d `title` (`SETTINGS_STRINGS.title`, `ROLES_STRINGS.title`, etc.) instead of inventing
parallel strings — these are the exact same `@@Settings`/`@@Roles`/etc. message IDs the screens
already carry. `DASHBOARD_STRINGS` is trimmed to just `title`/`signedInAs`/`logout` (the nav-button
labels it used to hold for the old dashboard button-grid moved to each screen's own strings file).
The one genuinely new string is a single sidebar section header (`ADMIN_MENU_STRINGS.section`,
`@@AdminMenuSectionLabel:Menu`) — nav-as-data (slice 3) may remove the need for it. Per the plan's
explicit slice sequencing ("i18n for shell/configurator user-visible strings" is slice 5's job), new
shell-only strings introduced this slice (`ShellAppName`, `ShellFooterBuiltWith`,
`AdminMenuSectionLabel`) are `$localize`-wrapped (never hardcoded — satisfies this repo's default
DoD for source code) but have no RU/RO overlay entries in `assets/i18n/*.json` yet; they render in
English under `ru`/`ro` until slice 5 adds the overlay values, which is a disclosed, deliberate gap,
not an oversight.

**Also resolved (open question 2 from the plan):** the old `dashboard.html` button-grid (the only
nav mechanism admin had before this slice — recon confirmed zero `MenuItem` usage anywhere) is
removed as redundant now that the sidebar carries the same destinations; the dashboard screen is
now just a greeting. Each other screen's own "Back to dashboard" link is left untouched — unlike the
dashboard grid, it doesn't duplicate the sidebar, and touching seven files for it is out of this
slice's scope.

## 2026-07-18 — M07 slice 2: configurator full port — provenance, GATE-0, and a premise correction

GATE-0 (before porting): re-cloned `primefaces/sakai-ng` at tag `21.0.0`, confirmed `HEAD` resolves to
the same pinned commit slice 1 already cites for the components (`96d71496d685b5c110efd2875abaa2bf89a56ad2`)
— no drift since slice 1. `src/app/layout/component/app.configurator.ts` is exactly 446 lines (matches
the plan's estimate), tracked directly in `sakai-ng`'s own root MIT `LICENSE.md` (not the unlicensed
`sakai-assets` submodule slice 1 had to route around — the configurator's TS was never in that
submodule), and confirmed Tailwind-saturated (`flex`, `gap-*`, `rounded-full`, `hidden`, `outline`,
arbitrary-value `shadow-[...]`) with exactly one `*ngIf` (`showMenuModeButton()`). GATE-0 passes as
scoped; no LICENSE surface issue this time.

**Premise correction — the brief's "scale control... 16 as the shipped default... persistence should
match what Sakai does" assumed a feature that does not exist upstream.** Recon of the pinned
`app.configurator.ts` found exactly four controls: Primary, Surface, Presets, Menu Mode — no scale/
font-size control in any form, at this tag or any other reachable tag (checked `layout.service.ts`
too: no `scale` field, upstream's 14px baseline is a static `html { font-size: 14px }` rule in
`_core.scss`, sourced from tag `20.0.0` in slice 1, not a runtime-adjustable setting). A repo-wide
grep of `sakai-ng`'s non-submodule tree for `localStorage`/`sessionStorage` also returned zero
matches — upstream persists **nothing** (preset/primary/surface/dark-mode/menu-mode all reset on
reload; `LayoutService`'s own `configSidebarVisible`/`showConfigSidebar()`/`hideConfigSidebar()` are
themselves dead code upstream, never called by either `app.topbar.ts` or
`app.floatingconfigurator.ts`, which each drive their own panel visibility through PrimeNG's
`pStyleClass` directive instead). So: the scale control is entirely our own addition (not a port —
there is nothing to port), and "match what Sakai does" for persistence means **add none** — confirmed
by live Playwright verification (operator-run): reloading after changing preset/primary/scale reverts
every field to the shipped defaults, matching upstream's own (lack of) behavior. Presented as a
disclosed finding, not a silent substitution — the brief's phrasing anticipated this ("do not invent
storage beyond what the source has").

**Scale implementation.** `LayoutConfig.scale` (`layout-service.ts`) — default `SHELL_SCALE_DEFAULT =
16` (px), range enforced in `ShellConfigurator` (`SCALE_MIN = 12`, `SCALE_MAX = 20`, a plain
decrement/increment stepper styled like this repo's existing `.layout-topbar-action` icon buttons,
not a new PrimeNG `InputNumber` dependency — simplicity-first, and the two other ported controls
already establish `p-selectbutton` as the one PrimeNG form primitive this panel needs). A new
`LayoutService` effect (`document.documentElement.style.fontSize = `${scale}px``) keeps the live DOM
in sync whenever the signal changes; `_core.scss`'s static `html` rule is bumped from the ported
14px to 16px too, so the pre-hydration paint already matches the shipped default instead of flashing
14px then jumping.

**Configurator SCSS has no MIT counterpart to port — authored by us against `@primeuix/themes`
tokens** (extends the slice-1 GATE-0 ruling: `sakai-assets`, the only place Tailwind-based configurator
styling could have shipped as plain CSS, has no LICENSE at all — out as a source for anything, not just
this file). New partial `styles/_configurator.scss`, forwarded from `shell.scss`. Per-class mapping
(Tailwind utility → own SCSS): `.flex.flex-col.gap-4` → `.layout-config-panel`/`.layout-config-panel-
section` (flex containers with matching `gap`); `.text-sm.text-muted-color.font-semibold` →
`.layout-config-panel-label`; the swatch buttons (`.w-5.h-5.rounded-full.outline.outline-primary`) →
`.layout-config-panel-color`/`.layout-config-panel-color-selected` (a 2px `border-color: var(--primary-
color)` instead of `outline`, consistent with how this file's borders are done elsewhere); the panel's
Tailwind `dark:bg-surface-900` variant is dropped entirely rather than ported — PrimeNG's design-token
CSS variables (`var(--surface-overlay)`) already resolve differently under `.app-dark` on their own, so
there is no dark-specific rule to write (same simplification `.layout-topbar-menu` already relies on
elsewhere in this SCSS tree). The open/close transition uses `@if` + native `animate.enter`/
`animate.leave` (own keyframes, `p-configurator-enter`/`-leave`) instead of upstream's `pStyleClass` +
Tailwind `animate-scalein`/`animate-fadeout`/`hidden` classes — mirrors `ShellMenuitem`'s existing
submenu-animation precedent (the one native-animation example already in this codebase) rather than
introducing `StyleClassModule`. Show/hide + outside-click-to-close is `LayoutState.configSidebarVisible`
(revived from slice-1's dead-on-arrival port, now actually wired) plus a manual `document` click
listener in `ShellTopbar` mirroring `ShellSidebar`'s existing outside-click pattern — chosen over
PrimeNG's `StyleClassModule` `[hideOnOutsideClick]` specifically to avoid re-introducing Tailwind class
names as the enter/leave vocabulary.

**The `*ngIf` holdout (`showMenuModeButton`, gated on `router.url.includes('auth')`) is dropped, not
migrated to `@if`.** In this app the shell only ever mounts inside the authenticated route subtree
(slice 1's routing design: `/login` is a sibling route outside `<nb-shell>`), so the upstream condition
— hide Menu Mode when the (also-upstream) floating configurator renders on a public/auth page — is
structurally always-true here; there is no second mount context to gate against. Consistent with slice
1's own precedent of dropping inert upstream chrome (the mobile "..." overlay, the Calendar/Messages/
Profile buttons) rather than porting a dead condition for fidelity. Two further pieces of dead upstream
code dropped for the same reason: the unused `config`/`primeng` (`PrimeNG`) injections in
`app.configurator.ts` (declared, never read) and the `Router` dependency they existed for.

**Test-infra gap found and fixed, unrelated to the configurator's own logic:**
`projects/common/tsconfig.spec.json` was missing `"@angular/localize"` in its `types` array (present
in `admin`'s and `app`'s tsconfig.spec.json already, absent only in `common`'s) — never triggered
before because no `common` spec file had exercised a `$localize`-using source file (`shell-footer.ts`/
`shell-topbar.ts` already used it since slice 1, just never imported by a spec). Fixed by adding the
missing types entry, plus a new `projects/common/src/test-setup.ts` (`import '@angular/localize/init'`)
wired via `setupFiles` in `angular.json`'s `common` test target — `@angular/localize/init` is a runtime
polyfill, not just a type; the vitest unit-test builder for a library project has no `polyfills` option
(that concept only exists on the application build targets), so `setupFiles` is the correct mechanism
here, not a workaround.

**Dev-server pitfall (operational, not a code note):** `admin` resolves `common` via the TS path
mapping `"common": ["./dist/common"]` (`tsconfig.json`) — a prebuilt library output, not live source
watching. An already-running `ng serve admin` process did not pick up a mid-session `ng build common`
rebuild (`dist/common` sits outside the dev server's watched source tree) until the dev server itself
was restarted; a plain browser reload was not enough. Worth knowing for any future slice that edits
`common` while `admin`/`app` are already serving.

---

## 2026-07-18 — harness: CI↔local-verify parity fix (front)

Follow-up to a same-session recon that audited local `scripts/verify.sh` (canon: back repo,
`nobilis-platform-back/scripts/verify.sh`) against `.github/workflows/ci.yml`, prompted by the
`fix-shell-menuitem-lint` incident (local green, CI red on lint). The recon found the lint gap was
already closed but surfaced three larger, still-open gaps: tests never ran in CI at all; local
verify built with `--configuration=development` while CI's `npm run build` defaults to
`production` (already proven able to flip a verdict — the admin bundle-budget incident, 2026-07-13
entry above); and formatting was CI-only. Operator ratified the fix set; this entry records the
decisions taken, not a new investigation.

- **CI gains a `Test (admin, app, common)` step** (`ci.yml`) running a new `npm run test:ci`
  script (`package.json`) — `ng test <project> --no-watch` for all three, chained. `ng test` with
  no project argument has no default (`angular.json` sets no `defaultProject` across this
  multi-project workspace), so this mirrors the exact three invocations `verify.sh` already ran
  locally rather than inventing a new test shape. → Angular CLI multi-project workspace docs.
- **Local verify switches from `--configuration=development` to `--configuration=production`**
  (`verify.sh`, front branch) — matches CI's `npm run build`, which has no `--configuration` flag
  and therefore resolves each project's `defaultConfiguration: "production"` (`angular.json`).
  Explicit `production` was chosen over omitting the flag (which would work identically today)
  because it self-documents intent even if a project's `defaultConfiguration` is ever changed —
  local verify is now pinned to "whatever CI actually builds", not "whatever the default happens
  to resolve to". This is the fix for the largest gap the recon found: budgets/AOT strictness that
  only fire under production were previously invisible to a local, pre-push run.
- **`node_modules/.bin/prettier --check .` appended to local verify** (`verify.sh`, front branch),
  after the lint/test chain, mirroring CI's `format:check` step in the same relative order
  (build → lint → test → format:check on both sides now).
- **Lockfile freshness: content-hash marker written by a new `postinstall` script, warn-only.**
  A new `postinstall` (`package.json`) runs `cksum package-lock.json >
  node_modules/.verify-lockfile-marker` on every `npm ci`/`npm install`; `verify.sh` compares the
  live lockfile's current `cksum` against that marker and, on mismatch, prints a loud stderr
  warning (visible immediately, not buried in the redirected build log) rather than failing. Two
  cheaper mechanisms were tried first and rejected on evidence, not guesswork: (1) hashing
  `package-lock.json` directly against npm's own `node_modules/.package-lock.json` snapshot —
  rejected because that file is npm's *pruned* copy (platform-optional deps, e.g. other-OS/arch
  `rollup`/`msgpackr` natives, are dropped from it), so it never byte-matches the root lockfile
  even right after a clean install (measured: 734 vs. 618 `packages` entries on this box); (2) an
  mtime comparison of the same two files — rejected because `git checkout` was observed rewriting
  `package-lock.json`'s mtime to checkout-time even when its *content* was byte-identical across
  the two branches (verified via `git diff`), which would false-warn on every branch switch. A
  dedicated content-hash marker, updated only by an actual install, isn't perturbed by either
  failure mode. Forcing `npm ci` on every local verify was rejected per the operator's explicit
  call (too slow for the fast-iteration path this script serves).
- **`.nvmrc` is now an exact Node-version requirement, not a floor.** `find_node()` previously
  accepted any installed Node `>=` the pinned version (`version_ge`, now removed); CI's
  `actions/setup-node` with `node-version-file: .nvmrc` resolves the *exact* pinned version, so a
  local Node newer than `.nvmrc` could previously pass local verify while exercising a runtime CI
  never runs. `find_node()` now requires `node -v` to equal `.nvmrc` exactly (via nvm's versioned
  install path, then a `PATH` node checked for exact equality); no match → verify skips the front
  check with a message, same "never false-green on a version gate" behavior as before, just at the
  correct (exact) tolerance.

Paired back-repo entry (JDK/locale/gitleaks-trigger parity): same date, back canon
`nobilis-platform-back/docs/sources-log.md`, "harness: CI↔local-verify parity fix (back)".
