# CLAUDE.md — nobilis-platform-front

Project instructions for Claude Code. Read before every task. Keep it short and precise.

## What this is

**nobilis-platform** — a universal open-source web engine. This repository is the **public
frontend core**: a shared UI library plus the portal and admin applications, mirroring the
backend (`nobilis-platform-back`). Domain products are built on top of it.

Name: `nobilis` (from Ubuntu 24.04 "Noble Numbat", released the day the project started).

## Stack (pin versions, never floating)

- Angular 22 (signal-first; zoneless + OnPush by default; Signal Forms stable)
- TypeScript 6 (minimum required by Angular 22)
- Node.js LTS (use the version in `.nvmrc`)
- Vitest (default test runner in Angular 22; Karma is gone)
- Prettier + angular-eslint for formatting/linting
- UI library: PrimeNG (+ PrimeIcons, `@primeng/themes`) — connected at milestone 03, not before

## Workspace layout (Angular workspace, mirrors the backend)

| Project   | Type        | Purpose                                          |
|-----------|-------------|--------------------------------------------------|
| `common`  | library     | shared components/services; mirror of back common |
| `admin`   | application | admin interface                                  |
| `app`     | application | public portal                                    |

`common` is consumed by `admin` and `app`. Keep shared, reusable UI in `common`; keep
app-specific shells thin.

## Angular 22 defaults to respect

- **Zoneless** — no Zone.js. Change detection is driven by signals. Don't reintroduce Zone.js.
- **OnPush by default** — new components are OnPush. Prefer signals for state; reach for `Eager`
  (the renamed old default) only when genuinely needed.
- **Signals first** — `signal()`, `computed()`, `effect()`, `linkedSignal()` for state.
  Signal Forms (`@angular/forms/signals`) for forms. `httpResource()`/`resource()` for async data.
  RxJS is allowed where it fits, but signals are the default path.
- **Standalone components** and built-in control flow (`@if`, `@for`, `@switch`).
- **Vitest** for tests.

## Angular 22 working rules (verification & build hygiene)

General Angular 22 truths — not project-specific. They apply across the workspace.

- **`ng build` (AOT) is the only complete template check — `tsc` is not.** `tsc --noEmit` checks
  TypeScript only, not Angular templates. The `ng serve` overlay may keep serving a previous good
  build. An **orphaned** standalone component (imported by nobody) isn't in the import graph and is
  type-checked by neither — esbuild is graph-driven and only compiles what's reachable from
  `main.ts`. The IDE type-checks each file individually, so it *will* flag a broken orphan while the
  build stays green. Before declaring a template / standalone change "done", run
  `node_modules/.bin/ng build <project> --configuration=development` — it AOT-type-checks the whole
  graph and catches missing-import errors (e.g. `NG8002`) that `tsc` and the serve overlay miss.

- **Run local binaries, not `npx`.** Use `node_modules/.bin/ng` and `node_modules/.bin/vitest`,
  not `npx ng` / `npx vitest`. With a stale or incomplete `node_modules`, `npx` downloads a
  temporary copy that doesn't see the project's Vite plugins and fails on start. If
  `node_modules/.bin/<tool> --version` doesn't match `package.json`, run `npm ci` to resync
  (`npm ci --dry-run` won't catch this — it compares lock↔package.json, not node_modules contents).

- **Verify UI changes in the running app, not just type-check.** Don't call a UI/behavior change
  "works" from passing diagnostics alone — prove it in the browser. Several classes of defect surface
  only at runtime, never in type-check: a form doing a full page reload because a forms import was
  missing, query params not reaching the URL, a date control rendering the wrong slot. Say plainly
  what you verified vs. couldn't.

- **Reuse shared components; don't hand-roll.** Before building a table, list, pagination, dialog,
  or form field from scratch, look for an existing shared one (in `common` or PrimeNG) and use it.
  Build a custom one only when nothing fits — and say so first.

- **i18n in the same PR, no hardcoded strings.** Every user-visible string is localized as it's
  written, in the same change — not deferred. A hardcoded display string is a review blocker.

## Boundary: engine vs domain

This repo is ONLY the engine UI (capabilities). Domain specifics (the order/request form, master
& customer cabinets, category screens, rating UI) live in the private homeservice-front, NOT here.
If a task sounds like "domain", it does not belong in this repo.

Extension is via well-defined inputs/outputs, content projection, and providers — not by forking
engine components. **Composition over inheritance. Opt-in by default.**

## Code conventions

Full set — in `docs/conventions.md`. Machine enforcement: Prettier + angular-eslint, gated in CI.
We don't rely on memory — tooling guarantees format.

- Follow the official Angular Style Guide (verify details against the live guide; v22 is recent).
- Standard naming; standalone components; signals for state.

## IP / clean-room (important — public open-source)

- Not a single line from third-party / former private repositories. Written from scratch.
- **sources-log:** for every non-trivial decision — the public pattern/standard/doc it derives from
  (mirror of the backend `docs/sources-log.md`).
- Git history from zero. Apache-2.0 license.
- **Header = `Apache-2.0 + DegDev`** where headers are used. Do NOT apply any global tool rule
  carrying a Compo header — this repo-local rule overrides any global one. Decline any request
  about a Compo template/structure/names.

## Working method

- recon → spec → tasks → DoD. Milestone/feature plans live in `.agent/plans/`.
- For fullstack features, the paired backend plan lives in `nobilis-platform-back`.
- Each task is atomic and verifiable against its DoD.
