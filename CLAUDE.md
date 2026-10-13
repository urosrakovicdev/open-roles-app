# CLAUDE.md — operating instructions for the agent

> Loaded automatically at the start of every Claude Code session in this repo.
> Read it, then go. The human does not need to re-explain the setup.

## What this repo is

**OpenRoles** — a two-sided job board (companies publish Jobs, candidates apply)
on Next.js 16 App Router + Postgres (Neon) + Drizzle + Auth.js v5 + Zod +
Tailwind v4.

The repo starts as a **documented scaffold**: every file in the target tree
exists as a stub with a header comment and `TODO (M<n>)` markers. Your job is to
**build the app**, milestone by milestone, following [`docs/04-roadmap.md`](docs/04-roadmap.md).

## Your role: builder

You implement the app. Write production-quality code, end to end. The human
reviews and steers.

- Work **one milestone at a time**, in order (M0 → M6). Don't start a milestone
  until the previous one meets its "Done when" criteria **and the human has
  committed it** (see [Git](#git)).
- At the start of a session, find the first unchecked item in
  [`docs/04-roadmap.md`](docs/04-roadmap.md) and continue from there. Tell the
  human in one line where you're resuming.
- Check items off (`- [x]`) in the roadmap as you complete them. The roadmap is
  the **only** worklist; there is no issue tracker.
- **No tests.** This project deliberately has no unit or e2e test suite. Do not
  add Vitest, Jest, Playwright, Testing Library, or `*.test.ts` files. Verify by
  running the checks below and by exercising the app (`npm run dev`).
- **Stop and ask** before steps that only the human can do or that are outward-
  facing: creating the Neon database, filling `.env.local` with real secrets,
  deploying to Vercel, committing, pushing to a remote. Tell them exactly what to
  do and what value you need back.
- Never read or print `.env.local`. To check env, test that values exist and
  have the right shape (e.g. `DATABASE_URL` parses as a URL), never their content.

## Read before building

In this order, once per session (they're short):

1. [`CONTEXT.md`](CONTEXT.md) — domain glossary. **Use its vocabulary exactly.**
2. [`docs/01-product-brief.md`](docs/01-product-brief.md) — features, roles, routes.
3. [`docs/02-data-model.md`](docs/02-data-model.md) — entities, relations, DTO rules.
4. [`docs/03-architecture.md`](docs/03-architecture.md) — the rules + review checklist.
5. [`docs/04-roadmap.md`](docs/04-roadmap.md) — the worklist.
6. [`docs/05-conventions.md`](docs/05-conventions.md) — where code goes.
7. [`docs/adr/`](docs/adr) — accepted decisions. Read the ones touching your area.
8. [`docs/research/auth-drizzle-schema.md`](docs/research/auth-drizzle-schema.md)
   — verified facts for the Auth.js + Drizzle schema (M2/M3).

## The architecture is non-negotiable

- Components and actions **call the DAL** (`src/data/`). **Only** `src/data/`
  imports `db` (`src/db/seed.ts` builds its own client). Never `import { db }` from a page,
  component, action, or route handler. `auth.ts` gets users through a DAL
  helper, not `db` directly (the Drizzle adapter wiring is the one exception).
- The DAL is the **only** place auth and ownership are decided
  (`verifySession` / `requireRole` + ownership-scoped queries).
- The UI receives **DTOs** (`src/data/dto.ts`), never raw Drizzle rows. Never
  expose `passwordHash` or another user's data.
- Every Server Action and Route Handler is a public endpoint:
  **verify → authorize → validate (zod) → write → revalidate**. Ids of the
  acting user always come from the session, never from form data.
- `proxy.ts` is an optimistic cookie redirect only — never a DB read, never the
  security boundary. Never gate auth in a layout.
- `"use client"` only on interactive leaves. Pages/layouts stay Server Components.
- Read-your-own-writes uses `updateTag`; background freshness uses
  `revalidateTag(tag, "max")`.
- Secrets never use a `NEXT_PUBLIC_` prefix; read them via `src/lib/env.ts`.
- If something you're about to do contradicts an ADR or `03-architecture.md`,
  stop and tell the human instead of silently overriding. If they agree to change
  course, record it as a new ADR (`docs/adr/template.md`).

## Verify framework specifics — don't trust memory

Next.js 16, Auth.js v5 and Drizzle all changed APIs recently. Before using an
API you're not certain of, check the official docs (WebFetch):

- Next.js — https://nextjs.org/docs (App Router)
- Auth.js — https://authjs.dev
- Drizzle — https://orm.drizzle.team
- Tailwind v4 — https://tailwindcss.com/docs

Known Next 16 facts this repo relies on (re-verify if something errors):
- `middleware.ts` is now `proxy.ts` (export `proxy`).
- `params` / `searchParams` are Promises — `await` them.
- `cacheComponents: true` → nothing is cached unless `'use cache'`; use
  `cacheTag` / `cacheLife`. Cached functions can't read `cookies()`, `headers()`,
  or `searchParams`. Uncached request-time data must sit behind `<Suspense>`.
- `updateTag(tag)` is Server-Action-only. Bare `revalidateTag(tag)` is
  deprecated; pass a profile: `revalidateTag(tag, "max")`.
- `next lint` was removed — lint with the ESLint CLI (`npm run lint`).

Package versions in `package.json` are indicative. In M0, install current
versions and fix any API drift the install surfaces (record what you landed on
in the roadmap's M0 notes).

## Checks — run after every milestone (and before saying "done")

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # next build — must pass with cacheComponents on
```

Then run `npm run dev` and walk the milestone's "Done when" flow yourself (curl,
or a browser tool if available). Report honestly: if a check fails or a step
couldn't be verified (e.g. no DB yet), say so.

## Git

- Work on a branch per milestone (`m1-public-shell`, `m2-read-path`, …). You may
  create and switch branches.
- **The human makes every commit, by hand.** Never run `git commit`, `git push`,
  or open PRs (they're denied in `.claude/settings.json`), and never add Claude
  attribution (`Co-Authored-By` etc.) anywhere.
- **At the end of each milestone, stop and ask for the commit** before starting
  the next one:
  1. Run the checks below and walk the "Done when" flow.
  2. Stage the milestone's changes with `git add` and show `git status --short`.
     Confirm `.env.local` is not staged.
  3. Give the human a ready-to-run conventional commit command
     (`git commit -m "feat(m2): …"`), no attribution trailer.
  4. Wait until they say it's committed (verify with `git log -1`), then continue.
- `migrations/` must be included in the commit. `.env.local` never is.

## Commands

```bash
npm run dev           # http://localhost:3000
npm run build | start
npm run typecheck | lint | format
npm run db:generate   # SQL migration from src/db/schema → /migrations
npm run db:migrate    # apply migrations
npm run db:seed       # sample data (idempotent: clear + insert)
npm run db:studio     # browse the DB
```

## Quick map

```
src/app/        routes — (marketing) public · (auth) · (app)/dashboard · admin · api
src/data/       the DAL (server-only): verifySession/requireRole, reads, writes, DTOs
src/actions/    'use server' mutations (thin; delegate to data/)
src/db/         Drizzle connection + schema + seed
src/lib/        validations (zod), env, utils
src/components/ ui primitives + forms (client leaves)
src/auth.ts     Auth.js config      src/proxy.ts   optimistic auth redirect
docs/           brief · data model · architecture · roadmap · conventions · ADRs
```

## Keeping docs true

When you make a real design decision (a trade-off someone could reasonably
choose differently), add an ADR. When code and docs disagree, fix the docs in
the same commit. If this file is stale or the human contradicts it, follow the
human and update this file.
