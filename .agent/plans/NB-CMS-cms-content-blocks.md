# Plan: CMS content-block mechanism — frontend admin screen

## Feature ID
NB-CMS

## Scope
fullstack — frontend part

**Paired plan:** `NB-CMS-cms-content-blocks.md` in the `nobilis-platform-back` repo.

## Branch
`03-cms-screen` — already cut from fresh `origin/main` during recon (frontend repo is on it now).
**Open action:** the backend repo (`nobilis-platform-back`) is still on `main` — cut a matching
`03-cms-screen` branch there too before backend work starts (same name, no slash, per branch
discipline). Not done by this plan step.

## Applicable playbook
- No ready frontend playbook exists yet for the CRUD-screen class — `docs/playbooks/README.md`
  states it's expected to appear "at milestone `03`, once the admin shell + PrimeNG land: build one
  screen properly → capture the pattern here". The **settings screen**
  (`projects/admin/src/app/settings/`) is the one built instance to mirror by direct file-copy
  (recon-confirmed, see Architectural decisions), but it is not yet extracted into a named playbook.
  This CMS screen is a candidate to become that extraction — flagged as a follow-up, not done here.
- fullstack: paired backend playbook `docs/playbooks/engine-screen-mounting.md` ([ready]) — backend
  wiring only, no frontend counterpart.

## Goal
Ship a thin, generic CMS admin screen (list/create/edit/delete "content blocks": a stable `key` +
localized `ru`/`ro` text + draft/publish `status`) on top of the existing CRUD kit, so the engine
has a content mechanism domain repos can key into — without building any concrete news/banner
screens (that's domain, milestone 07) or wiring images (deferred, BL-002).

## Architectural decisions

(Full rationale lives in the backend plan's Architectural decisions section — this is the frontend
consequence of those locked decisions.)

1. **Generic mechanism, not typed entities.** The screen manages one entity shape — `key` + `status`
   + a list of per-locale translations (`locale`, `body`) — no `NewsItem`/`Banner`-specific fields
   or forms. Domain repos supply concrete `key`s and render the resolved value; this repo never
   models what a key means.
2. **i18n-content editing**: the form/dialog edits **both locales in one screen** (ru + ro fields
   side by side or stacked), matching the backend's child-translation-table shape
   (`content_block` + `content_translation`, unique per `(content_block_id, locale)`). No per-locale
   routing/screens — one block = one edit surface for all its translations.
3. **Images/MinIO deferred (BL-002).** No file/image upload UI in this pass — text fields only
   (title/body-style textarea).
4. **CRUD kit extended, modestly**: add a `textarea` `FormFieldType` to
   `projects/common/src/lib/crud/form/form-field.ts` + wire a textarea input in `GenericForm`
   (PrimeNG `Textarea`/`InputTextarea`, matching whatever the kit already uses for `text`). Add
   nothing else (no drag-reorder, no rich-text/WYSIWYG) — those are explicit non-goals this pass.
   **If `status` (draft/publish) doesn't fit the kit's flat single-entity-per-row model cleanly
   because of the nested translations list, STOP mid-BUILD and report** — a bespoke screen (reusing
   only low-level table/dialog primitives, not the generic form) is the fallback, not a silent
   workaround.
5. **Reference pattern to copy 1:1** (recon-confirmed, `nobilis-platform-front`):
   - `projects/admin/src/app/settings/settings-page.ts:29-121` → structure for
     `content-blocks-page.ts` (list + paging via `GenericTable`, opens dialog via `CrudDialog`).
   - `projects/admin/src/app/settings/setting-form-dialog.ts:31-103` → structure for
     `content-block-form-dialog.ts` (built on `GenericForm`, `ProblemDetailError`/
     `fieldErrorsByKey` for server-side field errors) — extended to render the nested translations
     list (ru/ro) instead of a single flat field set.
   - `projects/admin/src/app/settings/settings-api.ts:15-39` → `content-blocks-api.ts`, thin
     `HttpClient` wrapper, `BASE = '/admin/api/content-blocks'`.
   - `projects/admin/src/app/settings/setting.ts:6-23` → `content-block.ts`, TS interfaces mirroring
     the backend DTOs (`ContentBlock { key, status, translations: ContentTranslation[] }`,
     `ContentTranslation { locale, body }`).
   - `projects/admin/src/app/settings/settings.strings.ts` → `content-blocks.strings.ts`.
   - `projects/admin/src/app/app.routes.ts:15-18` → add a lazy `content-blocks` route the same way.
   - Kit lives in `projects/common/src/lib/crud/` (`generic-table.ts`, `crud-dialog.ts`,
     `generic-form.ts`), consumed via the library's public `'common'` import — not deep imports.

## Files to create / change

### Frontend

- `projects/common/src/lib/crud/form/form-field.ts` — extend `FormFieldType` union with `'textarea'`.
- `projects/common/src/lib/crud/form/generic-form.ts` — wire the textarea case (import PrimeNG's
  textarea module, render it for `type === 'textarea'`), alongside the existing `text` case.
- `projects/admin/src/app/cms/content-block.ts` — `ContentBlock`, `ContentTranslation`,
  `ContentBlockCreateRequest`, `ContentBlockUpdateRequest` interfaces (mirrors backend DTOs; locale
  values `'ru' | 'ro'`; `status: 'DRAFT' | 'PUBLISHED'`).
- `projects/admin/src/app/cms/content-blocks-api.ts` — `ContentBlocksApi`, `HttpClient` wrapper,
  `list/create/update/delete`, `BASE = '/admin/api/content-blocks'`.
- `projects/admin/src/app/cms/content-blocks-page.ts` (+ `.html` if the settings screen uses a
  separate template — confirm at BUILD time) — `GenericTable`-based list/paging screen, columns:
  `key`, `status`, maybe a locale-coverage indicator (has ru/has ro).
- `projects/admin/src/app/cms/content-block-form-dialog.ts` (+ `.html`) — `GenericForm`-based
  create/edit dialog: `key` (text), `status` (dropdown/toggle DRAFT|PUBLISHED), and a translations
  section (ru textarea, ro textarea) — the one place this diverges structurally from settings'
  flat field list; watch item 4 above.
- `projects/admin/src/app/cms/content-blocks.strings.ts` — i18n display strings for the screen.
- `projects/admin/src/app/cms/content-blocks-page.spec.ts` — Vitest unit tests.
- `projects/admin/src/app/app.routes.ts` — add lazy route `{ path: 'content-blocks', canActivate:
  [authGuard], loadComponent: () => import('./cms/content-blocks-page')... }`.

## Open questions
1. Does the settings screen split component + template (`.html`) or use an inline template? Confirm
   at BUILD time by reading `setting-form-dialog.ts`/`settings-page.ts` in full before copying the
   shape.
2. Exact PrimeNG textarea component name/module to wire into `GenericForm` (`Textarea` vs
   `InputTextarea`, depends on the PrimeNG version pinned) — confirm via context7 at BUILD time, not
   from memory (Angular 22 / PrimeNG stack is newest-LTS, per project CLAUDE.md MCP rule).
3. UI shape for `status` — dropdown vs toggle vs radio; and for the two-locale translation editor —
   side-by-side vs stacked, vs tabs. Left to BUILD-time judgment unless the operator has a
   preference; not locked by this plan.
4. Whether this CMS screen becomes the first captured `crud-screen-frontend` playbook entry
   (currently empty per `docs/playbooks/README.md`) — worth doing once BUILD is done and the
   pattern is proven, per "extract, don't predict"; not required for this plan.

## Testing strategy

### Frontend
- Unit tests (Vitest + Angular TestBed): `content-blocks-page.spec.ts` — list renders, create/edit
  dialog opens and submits, delete confirmation flow, server-side field-error mapping.
- No E2E/browser verification required beyond the project's default DoD (`ng build --configuration
  development` for `admin`, then a manual/playwright pass per `docs/skills/angular22-verification`
  once milestone 03 UI-verification rules apply).

## Related features
- Cross-repo: paired backend plan `NB-CMS-cms-content-blocks.md` in `nobilis-platform-back`
  (entity/service/controller/migration — the contract this screen consumes).
- Depends on: `settings` screen (03-app-admin-shell, already built) as the direct structural
  template.
- Blocks: app-portal landing consuming real CMS content — explicitly out of scope this pass (landing
  stays a static placeholder, per the app-host-boot decoupling decision recorded in
  `docs/sources-log.md:505`).

## Risks
- The nested translations-list-per-block shape may not fit `GenericForm`'s flat `FormFieldState[]`
  model cleanly — if so, STOP per the locked decision above rather than forcing a workaround into
  the shared kit.
- Backend repo has no matching branch yet (`main` currently) — coordinate before backend BUILD
  starts so both repos' work lands on `03-cms-screen`.
- No frontend playbook exists for this task class yet, so BUILD is copying settings by direct file
  read, not by following a captured recipe — slightly higher risk of drift than a playbook-backed
  change; mitigate by reading the settings files in full before writing the CMS equivalents.
