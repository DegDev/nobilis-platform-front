# Playbooks

Repeatable task recipes for the engine frontend — patterns we've worked out once on a live example
and want to reproduce uniformly (Claude Code follows them instead of re-inventing).

## Principle: extract, don't predict

A playbook is written **after** the first real example, not before. An empty playbook written on
guesses will need rewriting after the first implementation. So this folder fills up as patterns
emerge, not in advance.

## When each playbook is likely to appear (guideline)

- **CRUD screen (list/create/edit/delete)** — at milestone `03`, once the admin shell + PrimeNG land:
  build one screen properly → capture the pattern here → then stamp out the rest by it.
- **Table view** (PrimeNG table: paging, sorting, filtering) — at milestone `03`.
- **Dynamic form** (Signal Forms driven by a field config) — at milestone `03`/`07`.
- **i18n for a new screen/field** — at milestone `05`.
- **Paired fullstack feature** (front screen + backend contract, two synced plans) — first real one
  at milestone `07` (domain slice) as the exemplar.

## Cross-repo note

For fullstack patterns, the frontend playbook references its **paired backend playbook** in
`nobilis-platform-back`. Keep the pair consistent: the contract (DTOs, endpoints) is the seam.

## Format

Each playbook is a separate `<name>.md`: the task class, steps, projects/files, common pitfalls,
readiness checklist. The `/plan` command reads this README and picks the matching one.

> Empty for now — that's expected. The first playbook appears at milestone `03`.
