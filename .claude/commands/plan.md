---
description: Create a feature plan in .agent/plans/ before implementation. Do not write code.
---

Create a feature plan. Do not write code.

The plan form follows the repo methodology: **recon → spec → tasks → DoD**. This command is for NEW
features that don't yet have a written plan. For fullstack features, this front plan has a **paired
backend plan** in `nobilis-platform-back` with the same file name — keep them in sync.

## Steps

**STEP 0 — pick a playbook.** Read this repo's `docs/playbooks/README.md` and pick the playbook
matching the task class — follow it while planning. If there are no playbooks yet or none fit — note
that explicitly in "Applicable playbook" and continue (playbooks fill in as real patterns emerge:
CRUD screen, table view, dynamic form, etc.).

1. **Check the directory** `.agent/plans/`. If missing — create it: `mkdir -p .agent/plans`.

2. **Ask the user** (if not given in the request):
   - **Scope**: frontend / fullstack
   - **Feature ID**: e.g. `NB-001` (for fullstack, reuse the same ID as the backend plan)
   - **Slug**: kebab-case description (e.g. `entity-translation`)
   - **Context from web discussion** (optional): if there's a detailed prompt with architectural
     analysis — use it for the "Architectural decisions" section.

3. **For fullstack / cross-repo** — find the backend repo path:
   - Read `.claude/local-config.json` if present; use `backend_path`.
   - If not present — ask the user for the path and offer to save it in `.claude/local-config.json`.
   - The paired backend plan must share the same `<feature-id>-<slug>.md` file name.

4. **Create the plan file(s)**:
   - **frontend only**: `.agent/plans/<feature-id>-<slug>.md` in this repo.
   - **fullstack**: this file holds the frontend part and links the paired backend plan. The backend
     part lives in `nobilis-platform-back/.agent/plans/<feature-id>-<slug>.md` (create/update it via
     the `backend_path`, or tell the user to run `/plan` on the backend side).

5. **Plan structure** (markdown):

```markdown
# Plan: <title>

## Feature ID
<e.g. NB-001>

## Scope
<frontend | fullstack — frontend part>

For fullstack:
**Paired plan:** `<feature-id>-<slug>.md` in nobilis-platform-back (backend part).

## Applicable playbook
- `docs/playbooks/<name>.md` — <why it fits the task class>
  (or: "no matching playbook — new pattern; capture it in playbooks after implementation")

## Recon (before code)
- Remaining TBDs to close before implementation.
- What to verify/read (Angular Style Guide, existing engine components, the backend API contract
  from the paired plan).
- Decisions → record in `docs/sources-log.md` (provenance, clean-room).

## Goal
<one sentence: what we do and why>

## Architectural decisions
<Key choices and rationale. Keep within the engine/domain boundary: this repo is engine UI only;
domain screens live in the homeservice-front repo. UI library is PrimeNG (from milestone 03).>

## Spec — files to create / change
Angular workspace: `common` (lib), `admin` (app), `app` (app).

- `projects/<project>/src/...` — description
- Shared, reusable UI → `common`. App shells stay thin.

## Tasks (atomic units)
1. ...
2. ...

## Testing strategy
- Unit (Vitest + Angular TestBed)
- Component / E2E — if applicable

## DoD (verifiable readiness criteria)
- <concrete, measurable: "ng build green", "npm run lint green", "component renders with signal
  inputs", "matches the backend contract from the paired plan", etc.>

## Open questions
1. ...

## Related features / dependencies
- Cross-repo: the paired backend plan (for fullstack)
- Blocking features / build-plan milestones

## Risks
- ...
```

6. **Show a summary** of the created file(s). Do not write code.

For trivial tasks (typo, rename) — ask whether a plan is needed at all, or you can just do it.
