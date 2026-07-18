# Plan: 07-admin-design — sakai-ng layout shell as an opt-in `common` capability

## Feature ID
`07-admin-design`

## Scope
Fullstack — **frontend part (primary)**. This milestone is frontend-only: no backend API/entity
changes. The backend plan is a thin anchor for provenance/backlog bookkeeping only.

**Paired plan:** `07-admin-design.md` in the backend repo (`nobilis-platform-back`) — anchor only,
no backend code.

## Applicable playbook
- `docs/playbooks/README.md` — **none fits yet**; the playbooks folder is still empty (first
  playbook is expected at milestone `03`-class work per the README, extract-don't-predict). This
  slice is itself a candidate to seed a future "fork-template import" playbook, but that extraction
  happens *after* a real example exists (this one), not ahead of it — do not write the playbook now.
- fullstack: paired backend side has no playbook either (bookkeeping-only anchor).

## Goal
Give the admin app a product-grade layout shell (topbar/sidebar/menu/footer + dark-mode/preset
configurator) by forking sakai-ng 21.0.0 into the front `common` library as an owned, versionless
capability — `admin` mounts it by default, `app` stays bare unless it explicitly opts in.

## Architectural decisions
Locked by the user in prior discussion; slices execute against these, they do not relitigate them.

1. **Fork-template import, not an npm dependency.** Source: `primefaces/sakai-ng@21.0.0` + its
   `sakai-assets` submodule (pinned commit), MIT-licensed. We copy the structural shell and the
   configurator into `common` and own the code from that point on — no live dependency on the
   upstream repo. Angular 21→22 migration is ours to do (recon found the surface essentially clean;
   one `*ngIf` holdout lives in the configurator, migrated in slice 2).
2. **Placement:** the layout shell lives in front `common`. `admin` is a **mandatory** consumer
   (mounts it in slice 1). `app` is **opt-in** (must still run bare with zero shell code pulled in
   until it explicitly imports it — proven in slice 4).
3. **No Tailwind in nobilis-front.** The structural shell (topbar/sidebar/menu/menuitem/footer) is
   already Tailwind-free upstream — recon confirmed plain SCSS against PrimeNG tokens, sourced from
   `sakai-assets`. The configurator (~446 lines) is the one piece written against Tailwind utility
   classes upstream; it is ported **in full** functionally, but re-styled from Tailwind utilities to
   SCSS on `@primeuix/themes` tokens — no Tailwind toolchain enters the repo.
4. **No zoneless migration workstream.** Sakai 21 is already zoneless + signal-based upstream
   (recon-confirmed) — this differs from some older Sakai forks and means there is no
   Zone.js-removal task hiding in this milestone.
5. **Scope = layout shell + configurator only.** Sakai's demo pages and dashboard widgets are
   explicitly NOT imported — this is a shell fork, not a demo-app fork.
6. **Animations:** the shell uses Angular's native `animate.enter`/`animate.leave` (Sakai's own
   current approach), not a custom animation trigger scheme.

## Files to create / change

### Backend
None. See paired anchor plan `07-admin-design.md` in `nobilis-platform-back` — the only backend
repo touch across this whole milestone is a BL-004 status update in
`docs/architecture-backlog.md`, made as part of slice 3's frontend commit (see below), not a
separate backend task.

### Frontend
Projects: `common` (library), `admin`, `app`.

**Slice 1 — vertical slice (shell in `common`, mounted in `admin`):**
- GATE-0 (before any file lands): fetch `sakai-ng@21.0.0` + its `sakai-assets` submodule (pinned
  commit) into a scratch/temp location (not a permanent git submodule of this repo unless recon
  in-slice determines otherwise — see Open questions), confirm the `sakai-assets` LICENSE file is
  MIT. STOP if it is not.
- `projects/common/src/lib/layout/` (new feature folder) — ported structural components: topbar,
  sidebar, menu, menuitem, footer, plus `LayoutService` (signal-based layout state: sidebar
  collapsed/mobile state, dark mode, active preset). Layout SCSS ported from `sakai-assets` into
  this folder, re-pointed at our `@primeuix/themes` token setup.
- `projects/common/src/public-api.ts` — export the new layout surface.
- `projects/admin/src/app/app.ts` / `app.html` — replace the current bare
  `<nav>` (EN/RU/RO buttons) + `<router-outlet />` root with the shell, carrying the existing admin
  destinations (`dashboard`, `settings`, `roles`, `accounts`, `content-blocks`, `integrations`,
  `notifications`, `ai-llm` — currently only reachable via `dashboard`'s button grid, see Open
  questions) as the sidebar menu. Locale switcher relocates into the shell's topbar.
- Configurator explicitly excluded from this slice.
- `docs/sources-log.md` — provenance entry: `primefaces/sakai-ng@21.0.0` + pinned `sakai-assets`
  commit SHA, MIT, what was ported vs left behind.

**Slice 2 — configurator full port:**
- `projects/common/src/lib/layout/configurator/` — full functional port of Sakai's configurator
  (preset switcher, dark-mode toggle, surface/primary color pickers). Template re-styled from
  Tailwind utility classes to SCSS against `@primeuix/themes` tokens; the one `*ngIf` holdout
  migrated to `@if`.
- Dark mode + preset switching wired into `LayoutService` from slice 1.

**Slice 3 — nav-as-data (resolves `BL-004`):**
- `projects/common/src/lib/layout/` — typed nav-model contract (e.g. `NavItem`/`NavSection`)
  replacing the shell's raw `MenuItem[]` + any-typed extras (`path`, `class`) carried over from
  Sakai. Model + declaration only — **no registry mechanism** (single consumer today; per
  extract-don't-predict, do not build a multi-module registry ahead of a second consumer).
- `projects/admin/src/app/` — admin's menu declared as data against the new typed model.
- `nobilis-platform-back/docs/architecture-backlog.md` — update `BL-004` status
  (`To align` → resolved/decided, referencing this slice), committed alongside this slice's
  frontend changes (cross-repo commit pair, not a separate backend task).

**Slice 4 — `app` opt-in:**
- `projects/app/src/app/` — proves both modes live: `app` mounts the shell via an explicit import
  from `common` in one branch/config, and runs bare (current state, zero shell code) in the other.
  No implicit magic — opt-in is a real import statement, not a flag.

**Slice 5 — polish:**
- i18n for every shell/configurator user-visible string — `*.strings.ts` + `assets/i18n/*.json`
  EN/RU/RO, same pattern as existing admin screens (EN native, RU/RO overlays, same-pass rule).
- Verify native `animate.enter`/`animate.leave` behavior live (sidebar collapse, mobile overlay).
- `projects/admin/src/app/app.config.ts` — remove `@angular/animations` /
  `provideAnimationsAsync()` **only if** recon confirms nothing else in `admin` needs the browser
  animations module after the shell migration (many PrimeNG overlay components use it — verify
  usages first, per the user's brief; do not remove speculatively).

## Open questions
1. **GATE-0 mechanics:** does "pull the sakai-assets submodule" mean adding a real, persistent git
   submodule to this repo (new `.gitmodules` entry), or a transient clone used only to extract
   files during slice 1 (no permanent submodule)? Current repo has no `.gitmodules` at all. Default
   assumption unless corrected: transient extraction, cited by pinned commit SHA in
   `sources-log.md` — no live upstream dependency, consistent with decision 1 ("fork-template, copy
   + own"). Confirm at slice 1 GATE-0, not before.
2. **Dashboard's role once the sidebar exists.** `projects/admin/src/app/dashboard/dashboard.html`
   is currently a button-grid hub linking to every other screen — the only nav mechanism admin has
   today (recon-confirmed: zero `MenuItem` usage anywhere in the repo, all navigation is
   `[routerLink]`/`p-button`). Once the sidebar carries the same destinations, is the dashboard's
   button grid removed as redundant, kept as a landing page, or repurposed? Decide in slice 1 when
   the sidebar destinations are wired — not a slice-1 blocker, but should not be left as
   unaddressed duplication after slice 1 lands.
3. **PrimeNG version alignment.** Sakai-ng 21.0.0 pins to a specific PrimeNG minor; our repo is
   pinned to `primeng@21.1.9` / `@primeuix/themes@2.0.3` under the existing `--legacy-peer-deps`
   bridge (see `03-app-admin-shell.md` risk). Slice 1 recon should confirm the ported components
   compile clean against our pinned versions before assuming zero friction.

## Testing strategy

### Backend
N/A — no backend code changes this milestone.

### Frontend
- **Unit (Vitest):** `LayoutService` state transitions (sidebar collapse/mobile, dark-mode toggle,
  active preset) and the configurator's preset-switching logic.
- **Build:** `ng build common admin app --configuration=development` (AOT) green after every
  slice; each project that consumes the shell must build clean.
- **Live (Playwright, required per project DoD):**
  - Slice 1: admin boots into the shell, sidebar shows all existing destinations, navigation and
    the relocated locale switcher work, responsive/mobile sidebar toggle works.
  - Slice 2: dark mode toggle and preset switching visibly change the rendered theme; no Tailwind
    classes remain (visual + DOM check).
  - Slice 4: `app` proven in both modes — with the shell mounted and running bare — no console
    errors either way.
  - Slice 5: `animate.enter`/`animate.leave` transitions observed live (sidebar collapse/expand,
    mobile overlay open/close); locale switch shows shell strings in EN/RU/RO.

## Related features
- Cross-repo: paired anchor plan `07-admin-design.md` in `nobilis-platform-back`.
- Depends on `03-app-admin-shell` (existing admin screens + routes this shell must carry as nav
  destinations) and `01-common` (locale store/signal the shell's locale switcher already uses).
- Resolves `BL-004` (admin nav-as-data) from `nobilis-platform-back/docs/architecture-backlog.md`
  in slice 3.
- Explicitly does not touch `BL-005` (production same-origin routing) — separate deployment track.
- Out of scope: nobilis design tokens layered on top of the Sakai baseline (next design iteration,
  not this milestone); any `app` domain screens; any backend code.

## Risks
- **`sakai-assets` submodule is a second fetch/license surface** — gated by slice 1 GATE-0 (MIT
  verification); STOP if the license doesn't check out.
- **Configurator re-style is the only sizable rewrite** (~446 lines, concentrated in slice 2) —
  Tailwind-to-SCSS is mechanical per-utility but large enough to hide a missed class; live
  Playwright verification in slice 2 is the actual safety net, not the build.
- **PrimeNG ↔ Angular 22 peer gap** (carried over from `03-app-admin-shell`, `--legacy-peer-deps` +
  CDK pin) still applies to every new component this milestone adds.
- **Cross-repo commit in slice 3** (frontend slice touching backend's `architecture-backlog.md`) —
  keep it a single-purpose addition to that file, not a vehicle for other backend edits.
