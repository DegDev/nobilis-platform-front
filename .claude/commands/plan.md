---
description: Create a feature plan in .agent/plans/ before implementation. Do not write code.
---

Create a feature plan. Do not write code.

## Steps

**STEP 0 — pick a playbook.** Read this repo's `docs/playbooks/README.md` and pick the playbook
matching the task class — follow it while planning, without re-explaining the pattern. If none fits,
note that and discuss with the user. For a fullstack task, the paired playbook in the other repo is
referenced by link (like paired plans).

1. **Check the directory** `.agent/plans/`. If it does not exist — create it: `mkdir -p .agent/plans`.

2. **Ask the user** (if not given in the request):
   - **Scope**: backend / frontend / fullstack
   - **Feature ID**: e.g. `NB-001`
   - **Slug**: kebab-case description (e.g. `common-foundation`)
   - **Prepared prompt from web chat** (optional): if there is a detailed prompt with architectural
     discussion already — use it as context for the "Architectural decisions" section.

3. **For fullstack / cross-repo** — find the sibling repo path:
   - Read `.claude/local-config.json` if present.
   - If `backend_path` (when we are in frontend) or `frontend_path` (when in backend) is set — use it.
   - If not — ask the user for the path, and offer to save it in `.claude/local-config.json` for
     future tasks.

4. **Create the plan file(s)**:
   - **backend only**: `.agent/plans/<feature-id>-<slug>.md` in the current repo. If we are in
     frontend — write the backend plan via the absolute path
     `<backend_path>/.agent/plans/<feature-id>-<slug>.md`.
   - **frontend only**: same, in the frontend repo.
   - **fullstack**: two files, one per repo, with the same name `<feature-id>-<slug>.md`. Each holds
     its own part with a mutual link.

5. **Plan structure** (markdown):

```markdown
# Plan: <title>

## Feature ID
<e.g. NB-001>

## Scope
<backend | frontend | fullstack — backend part | fullstack — frontend part>

For fullstack:
**Paired plan:** `<feature-id>-<slug>.md` in the <backend|frontend> repo.

## Applicable playbook
- `docs/playbooks/<name>.md` (this repo) — <why it fits the task class>
  (or: "none fits, needs discussion")
- fullstack: paired `<other-repo>/docs/playbooks/<name>.md`

## Goal
<one sentence: what we do and why>

## Architectural decisions
<If a prepared prompt exists — key choices and rationale from it. Otherwise a short description of
the technology choices. Keep within the engine/domain boundary: this repo is engine only; domain
screens/logic live in the homeservice repos. UI library is PrimeNG (from milestone 03).>

## Files to create / change

### Backend (if scope includes backend):
Modules: `common`, `ai`, `auth`, `app`, `admin`, `integration`.

- `<module>/src/main/java/...` — description
- Flyway (if needed): `common/src/main/resources/db/migration/<file>`

### Frontend (if scope includes frontend):
Projects: `common` (library), `admin`, `app`.

- `projects/<project>/src/...` — description

## Open questions
1. ...

## Testing strategy

### Backend (if applicable):
- Unit tests (JUnit 5)
- Integration tests if integrations are touched

### Frontend (if applicable):
- Unit tests (Vitest + Angular TestBed)
- Component / E2E tests if applicable

## Related features
- Cross-repo: the paired plan (for fullstack)
- Dependencies: blocking features / build-plan milestones

## Risks
- ...
```

6. **Show a summary** of the created file(s). Do not write code.

For trivial tasks (typo, rename) — ask whether a plan is needed at all, or you can just do it.