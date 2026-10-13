# ADR-0001 · Stack: Postgres + Drizzle + Auth.js

- **Status:** accepted
- **Date:** 2026-06-26 (amended 2026-10-13: test tooling removed)

## Context
OpenRoles needs a current, type-safe, framework-native stack where the DAL,
Server Actions and two-tier auth model can be expressed directly rather than
hidden behind a managed service.

## Decision
- **PostgreSQL (Neon serverless)** — the default relational DB for Next apps;
  Neon gives a free, serverless-friendly Postgres with a connection string.
- **Drizzle ORM** — "schema as code" in TypeScript, SQL-fluent, lightweight,
  excellent type inference; pairs cleanly with the DAL pattern.
- **Auth.js v5 (NextAuth)** — self-hosted; its `auth()` backs our
  `verifySession()`, and on Next 16 it wires through `proxy.ts`. Credentials
  provider with JWT sessions; Drizzle adapter for users/accounts.
- **Zod** for validation; **Tailwind v4** for styling.
- **No automated test suite** (amendment): verification is typecheck, lint,
  build, and manual flows per milestone.

## Consequences
- Easier: type-safe queries, a real migration story, auth primitives we can
  audit.
- Harder: more initial wiring than a managed all-in-one (e.g. Clerk); we own the
  auth edge cases. Without tests, regressions are caught only by types and manual
  checks.
- Traded away: Clerk's hosted UI/MFA and Prisma's larger ecosystem.
- Note: the Auth.js project is now part of Better Auth. Auth.js v5 remains
  documented and installable; revisit if it stops being maintained.

## Alternatives considered
- **Prisma** — great DX but heavier runtime; Drizzle is closer to SQL.
- **Clerk (managed auth)** — fastest, but hides the auth model we want to own.
- **Supabase** — bundles DB + auth + storage; more coupling than we want.
