# Plan: App-portal landing reads CMS (frontend)

## Feature ID
NB-LANDING

## Scope
fullstack — frontend part

**Paired plan:** `NB-LANDING-app-landing-cms.md` in the `nobilis-platform-back` repo
(`/home/deg/www/nobilis-platform-back/.agent/plans/NB-LANDING-app-landing-cms.md`).

## Branch
Cut fresh from `origin/main`: `git fetch origin && git switch -c 03-app-landing-cms origin/main`.
Integrations (`NB-INTEG`) just merged to `main` via PR #12 — base off `origin/main`, not a stale
local ref. If a half-cut `03-app-landing-cms` already exists locally, delete and re-cut it. Backend
repo needs the same-named branch cut before backend work starts (not done by this plan step).

## Applicable playbook
- No dedicated frontend playbook fits. This is the **first non-admin host** (`app`, not `admin`)
  mounting a `common` service and the **first public/anonymous** engine path — `docs/playbooks/README.md`
  has no entry for it, and the backend's `docs/playbooks/engine-screen-mounting.md` is explicitly
  **admin-only** by scope (its own header: "Scope: backend only ... no frontend counterpart"; all
  three extracted instances — settings/roles/accounts — mount into `admin`). Per the operator's
  extract-after-second-example rule, do NOT write a new playbook this pass; flag the gap here so it's
  picked up if a second app-portal-mounts-a-service case appears.
- fullstack: paired backend plan cites the same gap and the same non-applicable admin playbook.

## Goal
Make the `app` (public portal) process stateful enough to read CMS content it doesn't own — mount
the shared `ContentBlockService` in the `app` JVM process via a datasource profile (mirroring how
`admin` already does it), expose one public/anonymous read endpoint, and swap the static landing
placeholder for CMS-driven content that degrades gracefully when nothing is published yet.

## Architectural decisions

(Locked by the operator after RECON; forks resolved, not re-litigated here — see the paired backend
plan for the backend-side rationale on the same decisions.)

1. **Transport = in-process mount, not HTTP-to-admin.** `app` and `admin` are two runnables of one
   modular monolith sharing one Postgres; `app` mounts `common`'s `ContentBlockService` directly in
   its own process the same way `admin` does, rather than adding a public controller on the `admin`
   host and having `app` call it over HTTP. Rejected: an `admin`→`app` network hop that doesn't exist
   for any other engine capability.
2. **`app` becomes stateful via a datasource profile — the same mechanism as `admin`, not a bespoke
   "read-only JPA" construct.** `app`'s default `application.properties` currently excludes
   DataSource/HibernateJpa/DataJpaRepositories/Flyway autoconfiguration (the deliberate "stateless
   portal" boot decision) — this pass supersedes that only via a profile, mirroring `admin`'s
   `application-local.properties` pattern (empty `spring.autoconfigure.exclude=`, `spring.datasource.*`,
   `ddl-auto=validate`, `open-in-view=false`). `ContentBlockService` is
   `@ConditionalOnBean(EntityManagerFactory)` — once `app` has a datasource, the EMF exists and the
   service mounts with zero new wiring in `common`.
3. **Migrations stay in `common`/`auth`; `app` creates none.** `app`'s datasource profile causes
   in-process Flyway to apply the same classpath migrations `admin` already applies, against the same
   shared `flyway_schema_history` — idempotent regardless of which host boots first. `app` never gets
   its own migration files.
4. **The public read controller lives in `app`, not `common`, not `admin`.** `app` has no security
   contour at all (no `AdminContourFilter`/`ContourSecurityConfiguration`, no admin/security-starter
   dependency) — so a controller placed there is anonymous by construction, nothing to bypass. It sits
   beside the existing `app` `health` feature package, not inside `common`'s CMS package (engine
   library code stays transport-agnostic) and not inside `admin` (wrong host, wrong contour).
5. **Response shape is `app`'s own, not the admin `ContentBlockDto`.** The admin DTO is the
   admin-screen's shape (draft/publish workflow fields); the public path needs only `{key, locale,
   body}` or a bare body string — deciding the exact shape is part of this plan's BUILD pass, but it
   is never the admin DTO and never lives on an `/admin/api` path.

## Files to create / change

### Backend (`nobilis-platform-back`, app module — summarized; full detail in the paired plan)
- `app/src/main/resources/application-local.properties(.example)` — new datasource profile mirroring
  `admin/src/main/resources/application-local.properties`; update the existing "portal touches no
  database" comment in `app/src/main/resources/application.properties` so it no longer contradicts
  the new profile.
- New public controller (package sibling to `app/.../health`, e.g. `app/.../content` or
  `app/.../portal`): `GET /api/content/{key}?locale=` → `ContentBlockService.readPublished(key,
  locale)` → 200 with the resolved body, or 404 when absent/not-PUBLISHED. No `ContentBlockDto` reuse.
- New boot test proving both states: default (no datasource) still boots without
  `ContentBlockService`; profile-with-datasource boots with it present.
- Integration test (Testcontainers PG18) for the endpoint: PUBLISHED hit, DRAFT/absent → 404, unknown
  locale → ru fallback body (not an error), anonymous access with no token succeeds.

### Frontend (`projects/app`)
- `projects/app/src/app/app.config.ts` — add `provideHttpClient()` (recon-confirmed: currently
  absent, `app` is HTTP-zero).
- `projects/app/proxy.conf.json` — new file, mirrors `projects/admin/proxy.conf.json`, proxying to
  the `app` backend on `:8082` (not `admin`'s `:8080`).
- New portal content API service, local to `projects/app` (NOT `projects/common` — this is portal UI,
  not shared kit): thin `HttpClient` wrapper over `GET /api/content/{key}?locale=`.
- `projects/app/src/app/landing/landing.ts` (+ `.html`/`.strings.ts` as needed) — replace the static
  placeholder with a fetch of the landing CMS key(s) (e.g. `landing.hero`) via the new service;
  render the returned body. A 404 (key not yet PUBLISHED) renders an empty/graceful placeholder for
  that block — the landing must still render on a fresh DB with zero PUBLISHED content.
- `projects/app/src/app/landing/landing.spec.ts` — update/extend to cover: CMS content present →
  rendered; CMS content absent (404) → graceful empty state, no hard failure.

## Open questions
1. Exact response shape for `GET /api/content/{key}` — plain body string vs. `{key, locale, body}`
   DTO. Decide in the BUILD pass by whichever is smaller/simpler for the one frontend consumer; not
   an architectural fork, just an implementation call.
2. Which landing CMS key(s) to request (`landing.hero` only, or a small fixed set for multiple
   blocks) — the admin will create the actual content separately; this plan only needs agreement on
   the key name(s) the frontend requests.

## Testing strategy

### Backend (paired plan owns detail)
- Unit tests for the new controller (404 mapping, anonymous access).
- Integration test on Testcontainers PG18 covering PUBLISHED/DRAFT/absent/locale-fallback.
- Boot test proving stateless-default vs. datasource-profile mounting.

### Frontend
- Vitest + `HttpTestingController` for the new portal content API service (success body, 404 →
  graceful empty result, not a thrown error surfaced to the template).
- Vitest + Angular TestBed for `landing` component: renders CMS body when present; renders the
  empty/placeholder state when the key 404s.
- `ng build app --configuration=development` (AOT) — the only complete template check.
- Playwright verification (milestone 03+, mandatory for UI changes): navigate the running `app`
  portal, confirm the landing renders both with a PUBLISHED block and (separately or via a
  not-yet-published key) the graceful-empty path, inspect network requests and console for errors.

## Related features
- Cross-repo: paired backend plan `NB-LANDING-app-landing-cms.md` in `nobilis-platform-back`.
- Depends on: `NB-CMS` (CMS content-block mechanism + `ContentBlockService.readPublished`, already
  merged) and the `03-app-admin-shell` milestone (admin's datasource-profile pattern this mirrors).
- Playbook gap flagged (not written this pass): first non-admin host mounting a `common` service +
  first public/anonymous engine path — candidate playbook material after a second example.

## Risks
- Flipping `app` from stateless-by-design to stateful-for-CMS-reads is a real posture change for the
  portal host; scope this pass strictly to the datasource profile + one read path, not a general
  "portal now has a database" expansion.
- Anonymous endpoint on a host with zero security contour — correct by design here (recon-confirmed
  `app` has no contour to bypass), but any *future* endpoint added to `app` needs the same anonymous
  posture re-verified, not assumed from this precedent.
- Landing must degrade gracefully on a fresh DB (no PUBLISHED blocks yet) — a regression here would
  make the portal's home page appear broken to every visitor until the admin publishes content.
