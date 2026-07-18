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

**Slice 1 — vertical slice (shell in `common`, mounted in `admin`) — DONE, 2026-07-18:**
- GATE-0 outcome (full detail in `docs/sources-log.md`, "M07 slice 1" entry): the `sakai-assets`
  submodule has **no LICENSE at all** (no file in any commit/branch; GitHub's license API reports
  `null`) — it fails GATE-0 as literally scoped. Presented to the operator via AskUserQuestion;
  resolved by sourcing the layout SCSS from `primefaces/sakai-ng@20.0.0` instead (tag before
  PrimeTek split assets into that submodule — same content, tracked directly under sakai-ng's own
  MIT `LICENSE.md`; `layout.scss` diffed byte-identical to the 21.0.0 submodule). The Angular
  components (`app.layout.ts`, `app.topbar.ts`, `app.sidebar.ts`, `app.menu.ts`, `app.menuitem.ts`,
  `app.footer.ts`, `layout.service.ts`) were never in the unlicensed submodule — sourced from
  `21.0.0` as planned. Two pinned commits now, not one: `96d71496d685b5c110efd2875abaa2bf89a56ad2`
  (21.0.0, components) and `63c55fa37037d2e8854a63408315b9ee493cb66c` (20.0.0, SCSS).
- **Correction to decision 3's premise:** "structural shell is already Tailwind-free" holds for the
  SCSS and for sidebar/menu/menuitem/layout-service, but not for `app.topbar.ts` (`hidden lg:block`,
  `pStyleClass` + `animate-scalein`/`animate-fadeout`/`hidden`) or `app.footer.ts` (`text-primary
  font-bold hover:underline`). Resolved within the already-locked decisions 3 (no Tailwind) and 6
  (native animations) — no new decision needed, see sources-log for the exact fix per component.
- `projects/common/src/lib/layout/` — ported `LayoutService`, `Shell`, `ShellTopbar`,
  `ShellSidebar`, `ShellMenu`, `ShellMenuitem`, `ShellFooter` (`nb-shell*` selectors) +
  `styles/shell.scss` (forwarding partial + `_core`/`_main`/`_topbar`/`_menu`/`_footer`/
  `_responsive`/`_utils`/`_typography`/`_mixins`/`variables/*`). Configurator-only state
  (preset/primary/surface, config-sidebar visibility) deliberately not in `LayoutService` yet —
  slice 2 adds it. The mobile "…" topbar overlay (revealed only inert demo chrome, no admin
  behavior) was dropped rather than re-styled; sign-out reaches the topbar via `Shell`'s
  `<ng-content>` instead. Locale switching is baked directly into `ShellTopbar` (`LocaleStore` is
  already `common` infra, not admin-specific).
- `projects/common/src/public-api.ts` — exports the layout surface above.
- `projects/admin/src/app/shell/admin-shell.ts` (new) — thin admin-owned wrapper mounting
  `<nb-shell [menu]="ADMIN_MENU">` with a projected sign-out button; `admin-menu.ts` builds the
  `MenuItem[]` from the existing 8 destinations, reusing each screen's own already-translated
  `*_STRINGS.title` (zero new per-item strings). `Shell` mounts via `app.routes.ts` routing (a
  route-level wrapper around the authenticated subtree, `/login` sibling outside it) — matches
  upstream's own pattern and is why content projection, not a root-template mount, carries sign-out.
- `projects/admin/src/app/app.ts`/`app.html` simplified to a bare `<router-outlet />` (old EN/RU/RO
  `<nav>` removed — relocated into `ShellTopbar`); `login.ts`/`login.html` gained a small locale
  switcher of their own (the one route outside the shell, so it doesn't inherit the baked-in one).
- `projects/admin/src/app/dashboard/` — button-grid removed (open question 2, resolved: redundant
  with the sidebar); dashboard is now a plain greeting. Other screens' individual "Back to
  dashboard" links left untouched (don't duplicate the sidebar the way the grid did; out of scope).
- `projects/admin/src/app/app.config.ts` — `providePrimeNG` gained `darkModeSelector: '.app-dark'`
  (required for `LayoutService`'s dark-mode class toggle to actually drive PrimeNG's theme).
- Configurator explicitly excluded from this slice.
- `docs/sources-log.md` — full provenance entry, "M07 slice 1" (2026-07-18): both pinned commits,
  the GATE-0 resolution, the Tailwind premise correction, the routing/projection design note, and
  the i18n disclosure below.
- **i18n note:** per this slice's explicit sequencing (i18n consolidated in slice 5), the few new
  shell-only strings (`ShellAppName`, `ShellFooterBuiltWith`, `AdminMenuSectionLabel`) are
  `$localize`-wrapped now (no hardcoded source strings) but have no RU/RO `assets/i18n/*.json`
  overlay yet — falls back to EN under `ru`/`ro` until slice 5. Disclosed, not an oversight.

**Slice 2 — configurator full port — DONE, 2026-07-18:**
- GATE-0 outcome (full detail in `docs/sources-log.md`, "M07 slice 2" entry): re-confirmed the
  pinned `21.0.0` commit (`96d71496d685b5c110efd2875abaa2bf89a56ad2`), `app.configurator.ts` is
  exactly 446 lines, MIT-licensed directly in `sakai-ng`'s own tree (not the unlicensed
  `sakai-assets` submodule), Tailwind-saturated with one `*ngIf`. GATE-0 passes.
- **Premise correction, presented to and accepted by the operator:** upstream Sakai has no scale/
  font-size control at any tag and persists nothing at all (zero `localStorage`/`sessionStorage`
  usage repo-wide) — the brief's "scale control... persistence should match what Sakai does" was
  checked against the actual source, not assumed; the scale control is a full own addition (not a
  port), and "match Sakai" for persistence means adding none. Live-verified (operator-run): preset/
  primary/scale all reset to shipped defaults on reload.
- `projects/common/src/lib/layout/shell-configurator.ts` (new, `nb-shell-configurator`) — full
  functional port of Primary/Surface/Presets/Menu Mode (preset-switching logic, `getPresetExt()`,
  `$t()`/`updatePreset`/`updateSurfacePalette` wiring) plus a new Scale stepper (own addition,
  `SHELL_SCALE_DEFAULT = 16`, range 12–20). The `*ngIf` holdout (`showMenuModeButton`, gated on a
  router check for an 'auth' path that doesn't exist in this app's routing) is dropped rather than
  migrated to `@if` — structurally always-true here since the shell only mounts authenticated
  (slice 1) — consistent with slice 1's own precedent of dropping inert upstream chrome.
- `projects/common/src/lib/layout/styles/_configurator.scss` (new, forwarded from `shell.scss`) —
  own-authored SCSS against `@primeuix/themes` tokens (no MIT counterpart exists for this file in
  any sakai-ng/sakai-assets tree); open/close via native `@if` + `animate.enter`/`animate.leave`
  (mirrors `ShellMenuitem`'s existing precedent) instead of upstream's `pStyleClass` + Tailwind
  classes.
- `projects/common/src/lib/layout/layout-service.ts` — `LayoutConfig` gains `preset`/`primary`/
  `surface`/`scale`; `LayoutState` gains `configSidebarVisible` (+ `toggleConfigSidebar()`/
  `hideConfigSidebar()`); a new effect keeps `document.documentElement.style.fontSize` in sync with
  `scale`. `_core.scss`'s static default bumped 14px → 16px to match (decision below).
- `projects/common/src/lib/layout/shell-topbar.ts` — palette toggle button + `<nb-shell-
  configurator>` panel restored (dropped in slice 1), outside-click-to-close mirrors
  `ShellSidebar`'s existing pattern.
- **NEW LOCKED DECISION (operator, this slice):** shipped default UI scale is 16px root font-size,
  not Sakai's 14px — 4K reality. Exposed via the configurator's own Scale stepper.
- Dark mode + preset switching wired into `LayoutService` from slice 1; live-verified (operator-run
  Playwright) — dark mode, preset switching (Aura/Lara/Nora), and the scale stepper (16→18px, live
  DOM + visual re-scale) all confirmed working in the running admin app.
- Test-infra fix (unrelated to configurator logic, see sources-log): `common`'s
  `tsconfig.spec.json` was missing `"@angular/localize"` in `types` (present in admin/app already);
  added, plus `projects/common/src/test-setup.ts` wired via `angular.json`'s `setupFiles` for the
  `$localize` runtime polyfill vitest needs.
- New unit tests: `layout-service.spec.ts` (menu toggle in static/overlay/mobile, dark mode,
  config-sidebar toggle, active path), `shell-configurator.spec.ts` (primary/surface swatch clicks,
  scale clamp at 12/20, preset-switching logic).
- i18n: new strings (`ShellConfigurator*`) `$localize`-wrapped, no RU/RO overlay yet — same
  disclosed slice-5 gap as slice 1.

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
1. ~~GATE-0 mechanics~~ — **Resolved in slice 1.** Transient extraction (git clone to scratch,
   never a repo submodule), cited by pinned commit SHA — see slice 1 and `docs/sources-log.md`.
   Turned out to matter more than expected: GATE-0 actually failed for the submodule (no license at
   all), resolved by re-sourcing the SCSS from an earlier MIT-licensed sakai-ng tag instead.
2. ~~Dashboard's role once the sidebar exists~~ — **Resolved in slice 1.** Button-grid removed as
   redundant; dashboard is now a plain greeting screen.
3. **PrimeNG version alignment.** Sakai-ng 21.0.0 pins to a specific PrimeNG minor; our repo is
   pinned to `primeng@21.1.9` / `@primeuix/themes@2.0.3` under the existing `--legacy-peer-deps`
   bridge (see `03-app-admin-shell.md` risk). Slice 1 recon should confirm the ported components
   compile clean against our pinned versions before assuming zero friction — pending the slice 1
   `ng build` DoD check.

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
