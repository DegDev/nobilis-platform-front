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
