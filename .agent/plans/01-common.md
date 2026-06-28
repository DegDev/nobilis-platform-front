# Plan: 01-common — front-common (minimal foundation)

## Feature ID
`01-common` (milestone; depends on `00-foundation`, done)

## Scope
Fullstack — **frontend part**. The `common` Angular library only (task 7 of the milestone).
Minimal, extract-don't-predict: foundational plumbing, **no shared UI components** (no tables,
forms, dialogs — there are no screens yet; those are extracted at `03` when the first admin screens
reveal what is actually shared).

**Paired plan:** `01-common.md` in the backend repo (`nobilis-platform-back`) — the bulk of the
milestone: persistence base, Flyway baseline, crypto, settings, i18n resolution.

## Applicable playbook
- `docs/playbooks/` — **none fits yet**. The folder is intentionally empty until the first real
  example (CRUD screen / table / dynamic form at milestone `03`); per its README a playbook is
  extracted after the first example, not written ahead. No recipe to follow here.
- Paired backend playbook: none either (same reason).

## Goal
Add the two genuinely-foundational pieces of front-common that later milestones build on: a
signal-based current-locale service and a typed HTTP wrapper skeleton — nothing more.

## Architectural decisions
- **Angular 22 defaults** (per CLAUDE.md): zoneless, OnPush, standalone, signals-first. No Zone.js.
- **Locale service → signal-based.** `currentLocale` as a `signal<Locale>` with a `setLocale()`
  switch; `Locale` a union/enum of `ru | ro`, default `ru` (mirrors the backend fallback chain
  `requested → RU`). State via signal, not RxJS `BehaviorSubject` — signals are the default path.
  No HTTP, no persistence, no interceptor wiring yet (extract-don't-predict; user-preference
  persistence wires in with auth later).
- **HTTP wrapper → thin typed skeleton over `HttpClient`.** A small injectable that centralizes the
  API base URL and exposes typed `get`/`post`/… returning `Observable<T>` (or thin `httpResource`
  helpers where it fits). Skeleton only — no auth header injection, no error-toast interceptor, no
  retry policy yet; those attach when auth (`02`) and the admin shell (`03`) land. The point is one
  seam so app/admin don't each hand-roll `HttpClient` calls.
- **Boundary:** engine-only. Both pieces are capabilities, not domain. Exported from the library's
  `public-api.ts` so `admin` and `app` consume them.

## Contract (back ↔ front) — locale transport

The seam between this front locale service and the backend `LocaleResolver`. Both sides implement
to THIS contract, not to each other's code.

- **Transport: query parameter `?locale=<code>`.** The HTTP wrapper appends `?locale=<currentLocale>`
  to API requests so the backend can resolve the data/UI locale.
- **Valid values:** `ru`, `ro` (lowercase). Default `ru` (mirrors backend `DEFAULT_LOCALE`).
- **Scope in `01`:** the locale **signal + default + setLocale()** only. The actual appending of
  `?locale=` onto outgoing requests is wired when the first real API call appears (`02`/`03`) —
  in `01` the HTTP wrapper is a skeleton, so this is documented intent, not yet active code.
- **Backend side (paired plan):** `LocaleResolver` reads `?locale=`, falls back to `ru` on
  absent/invalid. Bundles populated at `05`.

## Files to create / change

### Frontend — project `common` (library)
- `projects/common/src/lib/i18n/locale.ts` — `Locale` type (`'ru' | 'ro'`) + default constant.
- `projects/common/src/lib/i18n/locale.service.ts` — `LocaleService`: `currentLocale` signal +
  `setLocale()`; `providedIn: 'root'`.
- `projects/common/src/lib/http/api.config.ts` — injection token / config for the API base URL.
- `projects/common/src/lib/http/api-client.service.ts` — `ApiClient`: thin typed wrapper over
  `HttpClient` (`get`/`post`/`put`/`delete`), base-URL aware; `providedIn: 'root'`.
- `projects/common/src/public-api.ts` — export the above (LocaleService, Locale, ApiClient,
  API config token).
- (No change to `admin` / `app` shells in `01` — they only need the library to resolve; wiring of
  `provideHttpClient` / API base URL value happens when the first real call appears at `02`/`03`.)

## Open questions
1. Keep the scaffold `Common` component (`common.ts`) or remove it now? Default: leave it until `03`
   when real shared components arrive, to avoid churn — but it can be dropped if the empty export is
   preferred.
2. `ApiClient` return type — `Observable<T>` vs `httpResource`-based helpers. Default: `Observable<T>`
   for the skeleton (simplest seam); revisit per-call at `03` when real screens show the access
   pattern.

## Testing strategy

### Frontend (Vitest + Angular TestBed)
- **Unit:** `LocaleService` — default is `ru`; `setLocale('ro')` flips the `currentLocale` signal;
  a `computed`/`effect` reader observes the change (proves signal reactivity, mirrors the backend
  locale-fallback test conceptually).
- **Unit:** `ApiClient` — with `HttpTestingController`, a `get('/x')` issues a request to
  `<base>/x` and returns the typed body (verifies base-URL composition + typing). No real network.
- Verify the library still **builds** (`ng build common`) and `public-api.ts` exports resolve —
  per CLAUDE.md, `ng build` (AOT) is the only complete check, not `tsc`.

## Related features
- **Paired plan:** `01-common.md` in `nobilis-platform-back` (persistence, crypto, settings, i18n).
- Consumed by `02-auth` (HTTP wrapper gains auth header / token handling), `03` (admin shell +
  PrimeNG + first CRUD screen; shared UI components extracted here then), `05-i18n-static` (locale
  service drives the real RU/RO bundle switching).

## Risks
- **Over-building.** The temptation is to add interceptors, error handling, persistence, or shared
  UI now — out of scope. Keep both pieces skeletal; resist speculative flexibility (Simplicity First).
- **Orphaned standalone code.** A service/component imported by nobody is type-checked by neither
  `tsc` nor the serve overlay — ensure everything new is exported from `public-api.ts` and covered by
  a test so `ng build` actually compiles it.
