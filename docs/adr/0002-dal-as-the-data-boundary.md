# ADR-0002 · A Data Access Layer is the only path to the database

- **Status:** accepted
- **Date:** 2026-06-26

## Context
In an App Router app, any Server Component or Server Action *can* import the DB
client and query directly. That scatters auth and ownership checks across dozens
of call sites — and a single forgotten check is an IDOR or a data leak
(the classic IDOR).

## Decision
All database access goes through `src/data/` (the DAL), which is `server-only`
and is the single place that (a) reads/writes the DB, (b) verifies session/role,
and (c) returns DTOs. Pages and actions call the DAL; they never `import { db }`
directly. Enforced by convention + ESLint intent + code review.

## Consequences
- Easier: one audited choke point; auth/ownership/DTO shaping reviewed in one
  place; the codebase is navigable ("where does data come from?" → `data/`).
- Harder: a little ceremony — a thin DAL function even for trivial reads.
- Traded away: the convenience of ad-hoc inline queries.

## Alternatives considered
- **Direct queries in components/actions** — simplest, but the IDOR/leak risk
  and scattered auth make it the wrong call for anything real (and it's the exact
  anti-pattern the lessons warn against).
- **HTTP API / Zero-Trust backend** — appropriate when another team owns the
  data; overkill here since Next.js *is* our backend.
