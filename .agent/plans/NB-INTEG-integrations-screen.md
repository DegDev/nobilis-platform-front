# Plan: Integrations screen (frontend)

## Feature ID
NB-INTEG

## Scope
fullstack — frontend part

**Paired plan:** `NB-INTEG-integrations-screen.md` in the `nobilis-platform-back` repo
(`/home/deg/www/nobilis-platform-back/.agent/plans/NB-INTEG-integrations-screen.md`, already
written and locked — see Architectural decisions below, which restate its finalized endpoint shape
rather than re-deciding it).

## Branch
Cut fresh from `origin/main`: `git fetch origin && git switch -c 03-integrations-screen
origin/main`. Repo is currently clean on `main`, in sync with `origin/main` (`c83b53c`) — no stale
`03-integrations-screen` exists locally or on origin, nothing to delete first. Backend repo also
needs the same-named branch cut before backend work starts (not done by this plan step).

## Applicable playbook
- No dedicated frontend CRUD-screen playbook exists yet (`docs/playbooks/README.md` still says
  "empty for now" for the frontend). The **settings screen**
  (`projects/admin/src/app/settings/`) is the one built instance to mirror by direct-pattern-copy
  (recon-confirmed below), same as the CMS screen did — this is a second data point toward that
  playbook, not the extraction pass itself.
- fullstack: paired backend playbook `docs/playbooks/engine-screen-mounting.md` ([ready]) —
  explicitly **not** the applicable shape here per the backend plan §"Applicable playbook": this
  feature adds a query param to the *existing* settings controller/service, it does not mount a new
  store/controller, so the mounting recipe's component-scan-exclude/auto-config ritual does not
  apply. Cited for context only.

## Goal
Ship an admin **Integrations** screen that lists `integration.<provider>.<name>` `Setting` rows
grouped by provider, and lets an operator set/replace each provider's secret — with zero new
frontend infra beyond what the settings screen already established (same DTO shape, same
write-only/masked contract, same nav/permission posture).

## Architectural decisions

Locked (operator-ratified in the original prompt; backend fork already resolved and written into
the paired backend plan — restated here as the frontend-visible contract, not re-litigated):

1. **No new entity/API surface — one query param on the existing settings endpoint.** The backend
   plan locked `GET /admin/api/settings?keyPrefix=integration.` (extending
   `SettingsController.list`, backed by a new `SettingRepository.findByKeyStartingWith` derived
   query) rather than a dedicated `/admin/api/integrations` controller. The frontend talks to the
   **existing** `/admin/api/settings` endpoint with an added `keyPrefix` param — no new API module,
   no new controller to model client-side.
2. **`SettingsApi`/`Setting`/`SettingDto` are reused as-is, unchanged.** Recon-confirmed
   (`projects/admin/src/app/settings/setting.ts:6-10`) the frontend `Setting` interface already
   matches the backend `SettingDto` (`key`, `value: string | null`, `secret: boolean`) — the
   Integrations screen's own `Setting`-shaped rows need no new DTO, just a new API method
   (`list` with a `keyPrefix`) and a new grouping view over the same shape.
3. **One secret per provider (default), free-form provider key.** Key convention
   `integration.<provider>.<name>`. The provider segment is content an admin can type — the engine
   makes no `Provider` enum. A short **frontend-only** list of well-known provider display names
   (e.g. `figma` → "Figma") is allowed as a presentation nicety, falling back to the raw segment
   for anything unrecognized — this is UI labeling, not an engine contract, so it lives entirely in
   the new screen's strings/helpers, never in `common`.
4. **Write-only + masked, no reveal, no masked tail.** Backend plan §6 locked: `SettingDto.value` is
   `null` whenever `secret` is `true` — no suffix is ever returned. The screen therefore renders
   **"set" / "not set"** only (`value == null && secret === true` → "set"; absent row → "not set"),
   never a partial value. This matches the existing settings screen's own masking treatment
   (`settings-page.ts:24-27`, `settings.strings.ts:14-15` `secretBadge`/`secretMask`).
5. **Bespoke per-provider card, not the flat `GenericTable`/`CrudDialog` kit.** The settings screen's
   kit (`GenericTable` + `CrudDialog` + `GenericForm`) models one flat entity per row/dialog. The
   Integrations screen's real unit is a *provider* (a grouping over N `integration.<provider>.*`
   rows, potentially several fields per provider even though this pass ships exactly one). Forcing
   the flat kit here would need either a fake single-row-per-provider entity or per-key dialog rows
   that don't read as "one card per integration" — same "kit doesn't fit, go bespoke" call the CMS
   screen made for its nested-translations shape. Reuse still applies at the primitive level:
   PrimeNG `Card`/`InputText`/`Button`/`ConfirmDialog` (already dependencies via the settings/CMS
   screens), the shared `ProblemDetailError` handling, and `SettingsApi`'s HTTP conventions
   (`toHttpParams`, Bearer via `authInterceptor`) — just not `GenericTable`/`CrudDialog`.
   **If, once the write flow is wired, a flat table actually reads fine, that's an implementation
   simplification to take — not a reason to force the kit up front.**
6. **Nav/route gating mirrors settings exactly.** Settings today has unconditional nav
   (`dashboard.html:7`, no permission check) and a route gated only by `authGuard`
   (`app.routes.ts:14-18`, `isAuthenticated`-only) — no client-side permission gating anywhere in
   this app yet (backend `@RequiresPermission` 403 is the real enforcement, recon-confirmed
   `SettingsController.java:60`). The Integrations route/nav entry get exactly the same shape:
   `authGuard`-only route, unconditional dashboard button. No new client-side permission
   infrastructure — that's an explicit out-of-scope, cross-screen future pass.
7. **English-only strings, mirroring `settings.strings.ts`.** One `INTEGRATIONS_STRINGS` const,
   same shape/rationale comment as `SETTINGS_STRINGS` — no RU/RO (milestone 05 infra, not built
   yet).
8. **Permission reused, not re-declared client-side.** No permission constant/gate exists in the
   frontend today for settings (see #6) — the Integrations screen introduces none either. Backend
   continues to gate via `SETTINGS_MANAGE` (backend plan §5); nothing for the frontend to mirror
   beyond the unconditional-route pattern already covered in #6.

## Files to create / change

Project: `admin` only (no `common` library changes anticipated — see Open questions #1 for the one
case that would add one).

- `projects/admin/src/app/integrations/integrations-api.ts` — new, mirrors
  `projects/admin/src/app/settings/settings-api.ts:14-39`: thin `HttpClient` wrapper over
  `/admin/api/settings`, `list()` adds `keyPrefix: 'integration.'` to `toHttpParams`, reuses
  `Setting`/`SettingUpdateRequest` write shape for `set(key, value)` (`secret: true` always, per
  decision 3 — one secret per provider).
- `projects/admin/src/app/integrations/integration.ts` — new, small view types: a `ProviderGroup`
  (or similar) derived client-side by parsing `integration.<provider>.<name>` out of the flat
  `Setting[]` response (decision 3's grouping is a pure frontend transform, no backend grouping
  endpoint). No new wire DTOs — reuses `Setting`/`SettingUpdateRequest` from `../settings/setting`
  (or duplicates the two fields locally if importing across feature folders reads wrong — decide in
  BUILD, not here; either is a one-line type).
- `projects/admin/src/app/integrations/integrations-page.ts` + `.html` (+ `.scss` if needed) — new,
  mirrors `settings-page.ts` structurally (signals for state, `OnPush`, strings from
  `INTEGRATIONS_STRINGS`) but renders PrimeNG `Card`s grouped by provider instead of
  `GenericTable`/`CrudDialog` (decision 5): per-card provider name, "set"/"not set" state, a
  write-only text input + Save button that calls `IntegrationsApi.set(key, value)`, reload-on-save
  (same pattern as `settings-page.ts:102-106`).
- `projects/admin/src/app/integrations/integrations.strings.ts` — new, mirrors
  `settings.strings.ts` shape (English-only, decision 7).
- `projects/admin/src/app/integrations/integrations-page.spec.ts` — new, mirrors
  `settings-page.spec.ts`'s coverage shape for the new page.
- `projects/admin/src/app/app.routes.ts` — add one route entry (after `settings`, alongside
  `roles`/`accounts`/`content-blocks`, `app.routes.ts:14-33`): `path: 'integrations'`,
  `canActivate: [authGuard]`, lazy `loadComponent` to `IntegrationsPage`.
- `projects/admin/src/app/dashboard/dashboard.html` — add one `p-button` nav entry
  (`dashboard.html:7-14` pattern), unconditional, alongside the existing four.
- `projects/admin/src/app/dashboard/dashboard.strings.ts` — add one `integrations: 'Integrations'`
  entry (`dashboard.strings.ts:6-13` pattern).

## Open questions

1. **Cross-feature type import vs. duplicate.** Should `integration.ts` import `Setting`/
   `SettingUpdateRequest` from `../settings/setting`, or declare its own equivalent two-field
   types? Both are one-liners; whichever reads more idiomatically once the grouping transform is
   written — not worth deciding blind before BUILD. Not blocking.
2. **Exact card layout / provider-label list** (decision 3's "known provider display names") is a
   presentation detail worked out in BUILD against the screenshot precedent, not specified field-
   by-field here — the locked constraint is just: no engine-level provider enum, frontend-only
   labels, safe fallback to the raw segment.

None of the above blocks starting BUILD — both resolve to a small, reversible choice made while
writing the screen.

## Testing strategy

### Frontend
- `integrations-page.spec.ts` (Vitest + Angular TestBed, `HttpTestingController` via
  `provideHttpClientTesting()` — mirrors `settings-page.spec.ts`'s harness):
  - Grouping: a flat `Setting[]` response with 2+ `integration.*` keys across 2+ providers renders
    one card per provider.
  - "set" vs "not set": a row with `secret: true, value: null` renders "set"; a provider with no
    row at all renders "not set".
  - Write path: entering a value and saving calls `IntegrationsApi.set` with the right key/value,
    then reloads.
  - Old value is never rendered anywhere (write-only) — assert the input starts empty even when
    "set" is true.
- `ng build admin --configuration=development` (AOT) green — the only complete template check per
  the `angular22-verification` skill.
- Route + nav smoke: `integrations` route resolves, dashboard renders the new button
  (extend `common-smoke.spec.ts` if that's where the existing four are covered — confirm shape in
  BUILD).
- Playwright verification (milestone 03+ rule, `angular22-verification` skill applies): navigate to
  `/integrations` in the running app, set a value for a provider, confirm the card flips to "set"
  and the input stays empty after reload; confirm network tab shows the `keyPrefix=integration.`
  request and no plaintext secret ever comes back on a GET.

## Related features
- Cross-repo: paired backend plan `NB-INTEG-integrations-screen.md` in `nobilis-platform-back` —
  frontend `integrations-api.ts` is written against that plan's final endpoint shape
  (`GET /admin/api/settings?keyPrefix=integration.`, existing `POST`/`PUT` reused unchanged). The
  frontend pass should not start writing `IntegrationsApi.list()` against a `keyPrefix` param the
  backend hasn't actually shipped yet — confirm the backend pass landed (or land backend first)
  before wiring the read call.
- Dependencies: rides entirely on the existing `settings` module (milestone 03 admin shell) — no
  other engine feature blocks this.

## Risks
- **Ordering with the backend pass.** If frontend BUILD starts before the backend `keyPrefix` param
  ships, `IntegrationsApi.list()` has nothing real to hit — sequence backend-first, or stub against
  the documented shape and re-verify once backend lands.
- **Kit-avoidance scope creep.** Decision 5 explicitly allows falling back to a flat table if the
  bespoke card layout turns out to be more code than it's worth — don't over-invest in card
  styling; this is a LIGHT-to-MEDIUM slice (one query param + one screen), not a design pass.
- **Provider-label list growing into an engine concern.** The frontend-only label map (decision 3)
  is a UI nicety with a plain-segment fallback — if it starts to want persistence, sorting, icons
  per provider, etc., that's scope creep into domain territory; stop and flag rather than build it
  out here.
