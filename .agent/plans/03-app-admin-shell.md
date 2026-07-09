# Plan: 03-app-admin-shell — admin Angular app (frontend)

> **RECONSTRUCTED POST-HOC (2026-07-09).** Built without running `/plan` first. Reconstructed from
> the front git history (`03-app-admin-shell` commits `5789c4e`…`45727e7`, PRs #3–#5) and the
> Milestone-03 dated sections of this repo's `docs/sources-log.md` — the actual source of truth.
> **Recon** and **Open questions** are not genuine pre-code sections (marked N/A / final state).
> Goal, Decisions, Spec, Tasks, DoD are factual as-built.

## Feature ID
`03-app-admin-shell` (milestone; depends on `01-common` front, `02`/`03` backend)

## Scope
Fullstack — **frontend part**. The Angular `admin` application: PrimeNG login → route guard →
dashboard, a generic CRUD kit in the `common` front library, then settings / roles / accounts
screens built on that kit. Zoneless, OnPush, signals, Signal Forms throughout.

**Paired plan:** `03-app-admin-shell.md` in the backend repo (`nobilis-platform-back`) — the admin
host, CRUD framework, and settings/roles/accounts admin APIs this UI calls.

## Applicable playbook
- `docs/playbooks/` (front) — none captured as a formal playbook yet; the generic CRUD-kit pattern
  (table + form + dialog + problem-detail mapper) emerged here and is the natural first front
  playbook candidate.

## Recon (before code)
**N/A — reconstructed post-hoc.** The premises a real recon would have surfaced (the PrimeNG 21 ↔
Angular 22 peer gap; zoneless/Signal-Forms wiring; the `?locale=` + thick-token transport to the
backend) are recorded as resolved facts below.

## Decisions (as-built, from sources-log)
1. **PrimeNG 21.1.9 on Angular 22 via `--legacy-peer-deps`** — latest PrimeNG still peers
   `@angular/common ^21`; `@angular/cdk` pinned to `21.2.14` (allows Angular 22 AND satisfies
   PrimeNG's `cdk ^21`). Compiles AOT + runs. Revisit when PrimeNG ships an Angular-22 peer.
2. **`.npmrc legacy-peer-deps=true`** at the repo root so CI (`npm ci`) resolves identically —
   committed later during `app-host-boot`'s CI-fix pass, not this milestone.
3. **Generic CRUD kit lives in the front `common` library** — table / form / dialog / problem-detail
   + pageable mappers — consumed by settings, roles, accounts (extract-from-real-use, not ahead).
4. **Thick token stored client-side; a route guard** protects the dashboard and admin screens.
5. **Zoneless + OnPush + signals + Signal Forms** throughout — the workspace's baseline.

## Goal
Render the first real admin UI: authenticate against the backend admin host, guard the app, and give
settings / roles / accounts management screens — all built on one reusable CRUD kit so each screen is
thin and consistent.

## Architectural decisions (as-built — full provenance in this repo's `docs/sources-log.md`)

- **Pass 1 — admin vertical slice:** a PrimeNG-themed login (Signal Forms) authenticates against the
  backend admin host, stores the thick token, and a route guard protects the dashboard. Proven
  end-to-end by a Playwright (Chromium) e2e. PrimeNG connects here (deferred from milestone 00).
- **Pass 3b — generic CRUD components (front `common` library):** table, form, dialog, a
  problem-detail (RFC 9457) parser, and pageable mappers — the kit every admin screen consumes, so a
  screen is just wiring, not plumbing. Extracted from the first real need, not built ahead.
- **Pass 3c — settings screen:** the first CRUD-kit consumer; validates the kit against a live
  backend API (secret values masked — the backend never sends them).
- **Pass 4c — roles screen:** roles + the permission catalog on the kit; unknown-permission and
  referenced-delete errors surface via the shared problem-detail mapping (409 / 400).
- **Pass 4e — accounts screen:** manage-existing accounts (status / realms / roles); no create, and
  "delete" is a status→BLOCKED update — the UI matches the backend's manage-only contract.
- **Transport:** admin API calls carry the thick token and the `?locale=` param (the back↔front
  contract from `01-common`).

## Spec — files created / changed (frontend)

- **admin app:** `projects/admin/src/app/auth/` (login + guard), `dashboard/`, and the routes/config
  wiring; PrimeNG theme.
- **front common (CRUD kit):** generic table / form / dialog components, a problem-detail parser, and
  pageable request/response mappers in the `common` library project.
- **screens:** `projects/admin/src/app/settings/`, `roles/`, `accounts/` — each a thin CRUD-kit
  consumer with its `*.strings.ts` (i18n seam).
- **build config:** root `.npmrc` (`legacy-peer-deps=true`); admin prod bundle budget raised to
  1.5 MB (both landed in the later `app-host-boot` CI-fix pass, recorded here for continuity).

## Tasks (atomic — as executed)
1. PrimeNG login + guard + dashboard + Playwright e2e (`5789c4e`).
2. Generic CRUD components in front-common (`759ea33`).
3. Settings screen on the CRUD kit (`d588736`) + e2e spec doc (`5c4a2cd`).
4. Roles management screen (`ad18345`).
5. Accounts management screen (`45727e7`).
6. CC PostToolUse format + Stop verify hooks (`2554763`).

## Testing strategy (as-built)
- **Unit / component (Vitest + Angular TestBed):** the CRUD-kit components and each screen.
- **E2E (Playwright, Chromium):** the login → guard → dashboard flow (interactive submit proven);
  the settings-CRUD spec is documented. Accounts mutate-path e2e is route-mocked, deferred to a
  future create-account milestone (no DB-login yet).

## DoD (as-built, all met for the admin track)
- Login authenticates against the backend admin host; the thick token is stored; the guard blocks
  the dashboard when unauthenticated.
- The CRUD kit backs all three screens (settings / roles / accounts) with consistent table / form /
  dialog / error handling.
- Backend RFC 9457 errors render through the shared problem-detail mapper (validation, 409, 400).
- Secret setting values are never shown (backend omits them).
- `ng build` (AOT) green for common / admin / app; unit + the login e2e green.
- Every non-trivial decision recorded in this repo's `docs/sources-log.md`.

## Open questions
**N/A — reconstructed post-hoc.** Deferred forward: accounts mutate-path e2e is route-mocked until a
create-account milestone exists; the PrimeNG `--legacy-peer-deps` bridge is removed once an
Angular-22 peer ships.

## Related features / dependencies
- Depends on the front `01-common` (locale signal + HTTP wrapper) and the `02`/`03` backend APIs.
- **Paired plan:** `03-app-admin-shell.md` in `nobilis-platform-back`.
- The `app` portal frontend (separate from admin) is still a bare shell — its first real route
  landed on `app-host-boot`; CMS-driven content and customer auth remain open in `03`/later.

## Risks (as-built)
- PrimeNG ↔ Angular 22 peer gap — bridged by `--legacy-peer-deps` + a CDK pin; a transitional debt
  until PrimeNG publishes an Angular-22 peer.
- Admin prod bundle size crept past the default budget (raised to 1.5 MB) — a lazy-split is the
  proper fix later, tracked separately.
