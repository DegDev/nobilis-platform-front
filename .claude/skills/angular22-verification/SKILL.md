---
name: angular22-verification
description: Angular 22 verification & build-hygiene rules — how to actually check a template/standalone/UI change works (ng build AOT vs tsc, local binaries vs npx, verify in the running browser, reuse shared components, i18n same-PR). Load before declaring any Angular build/template/UI change "done".
---

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
