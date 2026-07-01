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

## Package/folder structure — feature-first (CRITICAL, enforced)

Organize by FEATURE, not by technical type. Top-level folders inside a library/app
reflect capabilities, not Angular artifact kinds.

ALLOWED: feature folders — `locale/`, `http/`, `auth/`, `orders/`, etc. Each owns its
components, services, models, and guards for that feature.

FORBIDDEN as top-level buckets: `services/`, `components/`, `models/`, `guards/`,
`pipes/` containing unrelated features side by side. A feature's service lives WITH
its feature (LocaleService in locale/), not in a shared services/ bucket.

- When a feature grows, layer INSIDE it if helpful, but keep the feature as the unit.
- Export the public surface via the library's public-api.ts; keep internals unexported.

Rationale in docs/sources-log.md (same package-by-feature reasoning as the backend:
cohesion, low coupling, clear capability boundaries). Placing a class in a type bucket
because it's "easier" is a defect — put it in its feature.

## Secrets — never hardcode keys (CRITICAL, enforced)

NO key, secret, password, or token value is EVER written into a committed file —
not in source, not in resources, not in test resources, not in YAML/properties,
not in a Javadoc example. This includes the crypto master key, bank credentials,
Telegram/SMS tokens, JWT secrets — any credential.

ALLOWED in committed files: the NAME of a property (`nobilis.crypto.master-key`),
env-var placeholders (`${NOBILIS_CRYPTO_MASTER_KEY}`), and clearly-fake structural
samples in *.example files.

FORBIDDEN: a real or real-shaped value after `=` or `:` for any key/secret/password/
token, in ANY committed file including test resources. Tests that need a key generate
a fresh one at runtime (e.g. @DynamicPropertySource), never read it from a committed file.

This is not a discipline rule — it's gated. A pre-commit hook + CI secret-scan
(gitleaks) blocks any commit/merge carrying a secret-shaped value. A key in a file is
a defect even if the build is green.

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

## Working principles

How the agent works on every task — independent of the prompt's wording.

- **Think before coding.** State assumptions; if a request has more than one reading, surface the
  options instead of silently picking one. If a simpler approach exists, say so. When something is
  unclear, **STOP**, name exactly what's unclear, and ask — don't guess.
- **Simplicity first.** The minimum code that solves the task. No speculative features, abstractions,
  configurability, or error handling for impossible cases that weren't asked for.
- **Surgical changes.** Touch only what the task needs. Don't reformat, rename, or "improve"
  neighbouring code; match the existing style even where you'd do it differently. Each changed line
  must trace back to the request.
- **Goal-driven.** Turn the task into a verifiable success criterion and loop until it's met
  ("add validation" → write tests for bad input, then make them pass).

## Commit gate

The agent does **not** commit on its own. Finishing a task = **STOP + a short report** (files
touched, result, what was verified) **+ a proposed commit message**. The user reviews and commits.
This holds even when a specific prompt doesn't restate it; build/docs/fix prompts that repeat a
"commit gate" line are only echoing this rule.

## Branch discipline (CRITICAL, enforced)

One branch per milestone (`01-common`, `02-auth`, `03-app-admin-shell`, ...), branched from
`main`. **`main` is NEVER pushed to directly — all integration into `main` happens via a
GitHub Pull Request (PR), even for a single-commit change.** Docs commits ride on whatever
branch is current — universal, not milestone-locked.

**Before running `git commit` for ANY reason**, verify the current branch matches the
milestone/task actually being worked on by running `git branch --show-current`.
- If the current branch does NOT match what's being worked on — **STOP. Do not commit.**
  Report the mismatch, ask whether to switch or whether it's intentional.
- **Never `git push origin main`.** If work needs to land on `main`, open a PR from the
  current branch and stop — the user merges it (or explicitly asks the agent to via `gh pr
  merge`).

**On the remote:** merge PRs via "Squash and merge" or "Rebase and merge", NOT the default
"Merge pull request" — the latter creates a merge commit that breaks linear history.

## MCP servers — mandatory usage

This project runs Claude Code from VSCode against BOTH repos (`nobilis-platform-back`,
`nobilis-platform-front`) with IntelliJ IDEA open. The following MCP servers are connected and their
use is **required**, not optional. Do not fall back to plain text search or training-memory when an
MCP server covers the need.

### jetbrains — REQUIRED for all code navigation and inspection
You MUST use the `jetbrains` MCP server (the IntelliJ IDEA index) to read, navigate, and understand
the codebase — across BOTH the backend and frontend repos. Do not rely on plain `grep`/file globbing
or on memory of where things are when jetbrains can answer it.

- Before editing or referencing any symbol, resolve it through jetbrains (find the class/method/file,
  its definition, and its usages) instead of guessing its location or signature.
- To check the impact of a change, use jetbrains to find usages/references — not a text search.
- For multi-module structure (Maven modules, the dependency graph, Angular projects), query jetbrains
  rather than inferring from paths.
- Use IDEA's inspections/diagnostics via jetbrains to catch problems the build alone may not surface.
- If jetbrains is unavailable or returns nothing for a query, say so explicitly, then fall back —
  do not silently skip it.

This is a hard rule: jetbrains is the primary way to read this codebase. Skipping it and answering
from memory or raw text search is a defect.

### context7 — REQUIRED before using any library/framework API
The stack is deliberately newest-LTS (Java 25, Spring Boot 4.1, Angular 22, Hibernate 7, Flyway,
Postgres 18). Training memory for these is stale or wrong. Before writing code against a library or
framework API, you MUST consult `context7` for the current, version-correct documentation — do not
write the API from memory. This applies especially to: Spring Boot 4 / Spring Framework 7
configuration, Hibernate 7 (`@UuidGenerator`, JPA auditing), JCA crypto (`AES/GCM/NoPadding`), Flyway
config, and Angular 22 (signals, Signal Forms, zoneless, `httpResource`).

### playwright — UI verification, ONLY from milestone 03 onward
`playwright` is for verifying real UI in a running browser. It does NOT apply yet: through milestone
`01-common` and `02-auth` there are no screens. The frontend work in `01` is a locale service + an
HTTP wrapper skeleton (no rendered UI) — verify those with unit tests (Vitest + `HttpTestingController`)
and `ng build`, NOT with playwright.

From milestone `03` (admin shell + first screens) onward, every frontend task that produces or changes
UI MUST end with a playwright verification: navigate the running app, exercise the change, inspect the
rendered DOM + actual network requests + console errors. Type-check/build passing is NOT sufficient
for UI work — prove it in the browser via playwright. State plainly what was verified vs. what couldn't be.

### Cross-repo execution
A single Claude Code session works on both repos. For fullstack milestones, do the backend part in
`nobilis-platform-back` and the frontend part in `nobilis-platform-front`, following the paired plan
files (same `<feature-id>-<slug>.md` name in each, mutually linked). Sibling repo paths come from
`.claude/local-config.json` (`backend_path` / `frontend_path`).
