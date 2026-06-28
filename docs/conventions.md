# Code Conventions — nobilis-platform-front

The documentary layer of conventions (what the formatter/linter can't catch). Machine layer:
Prettier + angular-eslint, gated in CI before merge to `dev`.

Principle: **style is a nail in the build, not discipline or memory.** Tooling normalizes output
regardless of who/what wrote the code.

## Standard

The official **Angular Style Guide**. Angular 22 is recent (released June 3, 2026) and some style
details shifted (e.g. the `.component` suffix conventions) — verify against the live guide rather
than memory before relying on a specific rule.

## Tooling

- **Prettier** — formatter. Pin the version.
- **angular-eslint** + `eslint-config-prettier` — linter, with Prettier conflicts disabled.
- **EditorConfig** at the repo root (charset utf-8, LF, indent, trim trailing whitespace, final newline).
- Pin all tool versions — otherwise format drifts between machines and CI.

## Angular 22 patterns (defaults to follow)

- **Zoneless** — no Zone.js. Signals drive change detection.
- **OnPush by default** — new components are OnPush; the old eager strategy is now `Eager` and used
  only when needed.
- **Signals for state** — `signal()`, `computed()`, `effect()`, `linkedSignal()`.
- **Signal Forms** (`@angular/forms/signals`) for forms — typed, declarative, no `ControlValueAccessor`.
- **Async as signals** — `httpResource()` / `resource()` / `rxResource()` instead of manual `switchMap`
  plumbing where it fits.
- **Standalone components** and built-in control flow (`@if`, `@for`, `@switch`).
- **Vitest** for tests.

## Structure

- Feature-based organization; keep `common` (library) free of app-specific logic.
- Smart/presentational split where it earns its keep; don't over-abstract early.
- Clear component inputs/outputs; prefer composition and content projection over inheritance.

## Why public standards, not "how previous projects did it"

Adopting a named public standard (the Angular Style Guide) is a sources-log for code style:
"followed the Angular Style Guide", not "copied someone else's conventions". Cleaner for
clean-room and clearer to any external contributor.
