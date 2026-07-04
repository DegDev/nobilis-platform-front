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

Verification & build-hygiene rules (ng build = the only complete template check, local binaries
not `npx`, verify UI in the running browser, reuse shared components, i18n same-PR) live in the
skill `.claude/skills/angular22-verification/SKILL.md` — loaded on demand.

Recurring engine patterns become on-demand skills in `.claude/skills/`, not new CLAUDE.md prose.

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

No key/secret/password/token value is EVER written into a committed file — including source, test
resources, YAML/properties, and doc examples.
- ALLOWED: the NAME of a property (`nobilis.crypto.master-key`), env placeholders
  (`${NOBILIS_CRYPTO_MASTER_KEY}`), clearly-fake samples in `*.example` files.
- FORBIDDEN: a real or real-shaped value after `=`/`:` for any credential, in any committed file.
  Tests generate keys at runtime (e.g. @DynamicPropertySource), never read them from a file.
Gated by the gitleaks pre-commit hook + CI secret-scan — a key in a file is a defect even if green.

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
- Prompt taxonomy + recon-first standard: `docs/process/prompting-methodology.md`.
- When compacting, always preserve: current milestone/pass state, modified-files list, verify
  commands, locked decisions.

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
- **Context economy.** Exploratory or multi-file investigation runs in the `recon` subagent, which
  returns a compressed `file:line` summary marked "recon-confirmed — do not re-verify" — don't refill
  the main window with raw file dumps. Single-symbol lookups inline are fine.
- **Don't spin.** Do not silently retry a failing build/test/tool more than 3 times — STOP, report
  what's stuck and what was tried.

## Commit gate

The agent does **not** commit on its own. Finishing a task = **STOP + a short report** (files
touched, result, what was verified) **+ a proposed commit message**. The user reviews and commits.
This holds even when a specific prompt doesn't restate it; build/docs/fix prompts that repeat a
"commit gate" line are only echoing this rule.

## Default DoD (every task, before STOP)

The run-through before finishing any task (sections above hold the detail; this is the checklist):
- [ ] Build green — `node_modules/.bin/ng build <project> --configuration=development` for every affected project (AOT = the only complete check).
- [ ] Tests green — `node_modules/.bin/vitest` for touched code.
- [ ] UI changes verified in the running browser via playwright (milestone 03+), not type-check alone.
- [ ] i18n in the same change — no hardcoded user-visible strings.
- [ ] No hardcoded secrets (the gitleaks pre-commit hook also gates this).
- [ ] Correct branch — `git branch --show-current` matches the milestone/task.
- [ ] sources-log updated for any non-trivial decision.
- [ ] STOP + short report (files touched, result, what was verified) + proposed commit message.

## Branch discipline (CRITICAL, enforced)

One branch per milestone (`01-common`, `02-auth`, `03-app-admin-shell`, …), branched from `main`.
`main` is NEVER pushed to directly — integration is via a GitHub PR only, even for one commit
(merge with "Squash and merge"/"Rebase and merge", never a merge commit). A feature branch's
upstream is ALWAYS its namesake `origin/<same-name>`, never `main`/an integration branch (first
push: `git push -u origin <branch>`). Run `git branch --show-current` before any commit.
Docs commits ride the current branch. Enforced physically by the `pre-commit`/`pre-push` hooks in
`.githooks/` — they gate the human too.

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
