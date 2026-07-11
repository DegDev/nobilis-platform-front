# Plan: Notifications config (frontend)

> **RECONSTRUCTED POST-HOC (2026-07-11).** Built without running `/plan` first (GLM skipped it).
> Reconstructed from the git history (`03-notifications-config` commit `b898d7c`, merged in
> PR #13) — there is no pre-code plan/recon file for this feature. **Recon** and **Open questions**
> are N/A, not genuine pre-code sections. Everything else (Goal, Architectural decisions, Spec,
> Tasks, DoD, Lessons) is factual — what was actually shipped, plus what review+smoke caught.

## Feature ID
NB-NOTIF

## Scope
fullstack — frontend part

**Paired plan:** `NB-NOTIF-notifications-config.md` in `nobilis-platform-back`
(`/home/deg/www/nobilis-platform-back/.agent/plans/NB-NOTIF-notifications-config.md`) — the backend
plan carries the full entity/endpoint/permission decisions; this file restates only what the
frontend consumes.

## Applicable playbook
- `angular22-verification` skill — build/verification hygiene; this feature is also the source of
  its "dialog Save that fires no HTTP request is usually a broken form binding" addendum (see
  Lessons below).
- No dedicated frontend CRUD-screen playbook exists yet. The **content-block-translations-dialog**
  (from `NB-CMS-cms-content-blocks`) is the pattern this screen's translations dialog mirrors
  (signal-based state, not Reactive Forms) — see Lessons, defect 6.

## Recon (before code)
**N/A — reconstructed post-hoc.** No pre-code recon file was written.

## Decisions (as-built, restating the backend's finalized contract)
1. **One `/notifications` route, tabbed Types/Templates** — not two separate routes.
2. **Translations dialog uses the CMS signal-based pattern**, not Reactive Forms.
3. **Config/data only — no dispatch UI.**
4. **No new client-side permission gating** — `NOTIFICATIONS_MANAGE` is enforced server-side only.

## Goal
Ship an admin Notifications screen — tabbed Types/Templates, with a per-locale translations dialog
— on top of the backend's `NotificationType`/`NotificationTemplate` endpoints, reusing the CMS
screen's signal-based dialog pattern rather than Reactive Forms. Config/data only, no send-UI.

## Architectural decisions (as-built, locked forks — restating the backend's finalized contract)

1. **One `/notifications` route, tabbed Types/Templates** — a single admin screen with two tabs
   over the backend's two endpoint groups (`/admin/api/notification-types`,
   `/admin/api/notification-templates`), not two separate routes.
2. **Translations dialog uses the CMS signal-based pattern**, not Reactive Forms:
   `signal<Record<Locale, State>>` + `setX` mutators + direct per-locale API calls — same shape as
   `content-block-translations-dialog`. Subject nullable, body required, `ru`/`ro` locales, mirroring
   the backend's translation-child-table shape.
3. **Config/data only — no dispatch UI.** Sending notifications is milestone 04 backend work with
   no frontend counterpart yet; this screen only manages types/templates/translations.
4. **No new client-side permission gating** — same posture as every other admin screen so far
   (settings, roles, accounts, CMS, integrations): `authGuard`-only route, unconditional dashboard
   nav entry; `NOTIFICATIONS_MANAGE` is enforced server-side only.

## Spec — files created / changed (frontend)

`projects/admin/src/app/notifications/`:
- `notification.ts` — view/DTO types for type/template/translation.
- `notifications-api.ts` — `HttpClient` wrapper over both backend endpoint groups.
- `notifications-page.ts` / `.html` / `.scss` — tabbed Types/Templates page (229 lines TS).
- `notification-type-form-dialog.ts` — type create/edit dialog.
- `notification-template-form-dialog.ts` — template create/edit dialog.
- `notification-translations-dialog.ts` / `.html` / `.scss` — per-locale subject+body editor,
  signal-based (defect 6 below).
- `notifications.strings.ts` — screen strings.

Plus one route entry (`app.routes.ts`) and one nav button + string
(`dashboard.html`, `dashboard.strings.ts`) — same shape as every prior admin screen.

## Tasks (as executed)
1. `b898d7c` — feat(notifications): the full frontend slice (Types + Templates tabs, translations
   dialog, route + nav) in one commit, 14 files, 926 insertions.

## Testing strategy (as-built)
- `ng build admin --configuration=development` (AOT) — the only complete template check per the
  `angular22-verification` skill.
- Manual/smoke verification in the running app is what caught defect 6 below (build + Vitest alone
  did not surface the `NG01050`).

## DoD (as-built, all met)
- Tabbed `/notifications` route renders Types and Templates.
- Translations dialog saves successfully (PUT visible in Network, 2xx, reopening shows persisted
  values) — only true after the fix in Lessons defect 6.
- `ng build admin` green.

## Lessons / defects caught in review + smoke

Shared with the backend plan's list (this file states the frontend-owned one in full; see the
backend plan for the other five, which are backend-side):

6. **Translations dialog `formControlName` without an enclosing `[formGroup]`.** The initial
   translations dialog used Angular Reactive Forms with `formControlName` bindings but no
   surrounding `[formGroup]` directive — Angular throws `NG01050` at runtime. Both `ng build` and
   Vitest stayed green because the error only fires when the component actually renders; Save
   silently did nothing. Fixed by dropping Reactive Forms for this dialog and mirroring the proven
   `content-block-translations-dialog` pattern instead: `signal<Record<Locale, State>>` + `setX`
   mutators + direct per-locale API calls. Now codified in the `angular22-verification` skill: a
   dialog/form Save that fires no HTTP request is usually a broken form binding, not a logic bug —
   verify Save in a running browser, not from diagnostics alone.

The other five defects (stale permission-catalog test, snake_case test-method names, an
already-applied migration that had to be backfilled via a new migration instead of an edit,
`LazyInitializationException` on the backend template-list endpoint, `listTemplatesByType`
ignoring its own filter) are backend-side — see the paired backend plan's Lessons section for
detail.

## Open questions
**N/A — reconstructed post-hoc.**

## Related features / dependencies
- Depends on `03-app-admin-shell` (admin shell, route/nav conventions) and
  `NB-CMS-cms-content-blocks` (the signal-based translations-dialog pattern this screen reuses).
- Cross-repo: paired backend plan `NB-NOTIF-notifications-config.md` in `nobilis-platform-back` —
  the frontend `notifications-api.ts` is written against that plan's endpoint shapes.

## Risks (as-built)
- **No `/plan` discipline on this pass** — see the backend plan's Risks section; the same
  reasoning applies here (defect 6 is exactly the class of runtime-only failure a
  written-up-front testing strategy tends to name explicitly before code, rather than catch after).
