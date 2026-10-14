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
  merged it into `main`** (see [Git](#git)).
- **One milestone per session** by default. When a milestone is merged, stop;
  the human starts a fresh session for the next one — unless they tell you to
  continue in the same session.
- **Split large milestones into chunks** (see [Git › Chunks](#chunks)). A
  milestone is large when it has more than ~4 roadmap items or spans several
  layers (schema / DAL / actions / UI). Each chunk is a coherent slice that
  builds and runs on its own and is small enough to review in one sitting.
  Announce the chunk plan before you start, and record it in the milestone's
  **Notes**.
- At the start of a session, find the first unchecked item in
  [`docs/04-roadmap.md`](docs/04-roadmap.md) and continue from there. Tell the
  human in one line where you're resuming. If you're mid-milestone, make sure
  you're on that milestone's branch.
- **Stay inside the milestone.** Don't implement a later milestone's
  `TODO (M<n>)` early, don't refactor code the milestone doesn't touch, and don't
  add features outside [`01-product-brief.md`](docs/01-product-brief.md). If you
  spot a problem outside scope, note it in the milestone's **Notes** instead.
- **Small ambiguities: decide, don't ask.** When the docs don't cover a detail
  (copy, spacing, a helper's name, an error message), pick what fits the docs
  best and record it in the milestone's **Notes**. Ask the human only when the
  choice changes product behaviour, data shape, or an ADR.
- Check items off (`- [x]`) in the roadmap as you complete them. The roadmap is
  the **only** worklist; there is no issue tracker.
- **No tests.** This project deliberately has no unit or e2e test suite. Do not
  add Vitest, Jest, Playwright, Testing Library, or `*.test.ts` files. Verify by
  running the checks below and by exercising the app (`npm run dev`).
- **Stop and ask** before steps that only the human can do or that are outward-
  facing: creating the Neon database, filling `.env.local` with real secrets,
  deploying to Vercel, merging a milestone into `main`, pushing to a remote. Tell them exactly what to
  do and what value you need back.
- Never read or print `.env.local`. To check env, test that values exist and
  have the right shape (e.g. `DATABASE_URL` parses as a URL), never their content.

## Environment & safety

- **Shell:** this is Windows. Run commands with the **Bash** tool (Git Bash), not
  PowerShell — the pre-approved commands in `.claude/settings.json` are Bash rules.
- **Database:** `.env.local` points at the Neon **`dev`** branch (Frankfurt,
  pooled). Migrations, `db:seed` (which clears tables) and experiments only ever
  run there. Never point a command at the `production` branch — that happens
  once, by the human, in M6.
- **Dev server:** start `npm run dev` in the background, and stop it when you're
  done verifying, so it doesn't hold port 3000 into the next session. If 3000 is
  taken, find and stop the stale server rather than using another port.
- One-off scripts (e.g. a DB check) go in the scratchpad or are deleted right
  after; never leave them in the repo.
- **Neon skills** (`.claude/skills/neon*`, pinned in `skills-lock.json`) are
  reference material for Postgres on Neon: pooled vs direct, migrations,
  branching, scale-to-zero. This repo's docs and ADRs win over them:
  - Auth is **Auth.js** ([ADR-0001](docs/adr/0001-stack-choice.md)) — never
    Neon Auth / Managed Better Auth, even in M3 before Auth.js is wired.
  - No Neon CLI provisioning: don't run `neon init` / `link` / `checkout` /
    `deploy` / `env pull` / `mcp`, and don't add `neon.ts`, Neon Functions,
    Object Storage, Data API or AI Gateway. They rewrite `.env.local` or add
    infrastructure the docs don't have. The Neon CLI is denied in settings.

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
9. [`docs/06-production.md`](docs/06-production.md) — env, migrations,
   caching and deploys in production (M6+).

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

- Next.js — **first** the docs bundled with the installed version in
  `node_modules/next/dist/docs/` (they match exactly; see `AGENTS.md`, which
  `next dev` writes — keep it committed), then https://nextjs.org/docs
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
- **Instant-navigation validation** (16.3+, on with `cacheComponents` +
  `partialPrefetching`): every route segment that reads request-time data
  (session, `params`, `searchParams`, `connection()`) needs its **own** boundary —
  a `loading.tsx` in that segment or a `<Suspense>` inside its page. A parent
  `loading.tsx` covers the first load but not navigation between siblings.
  Errors show in the dev log and `next build`.
  See https://nextjs.org/docs/messages/blocking-prerender-dynamic.
- `verifySession()` calls `await connection()` before `auth()` — Auth.js uses
  `crypto.getRandomValues()` before reading cookies, which prerendering rejects.

Package versions in `package.json` are indicative. In M0, install current
versions and fix any API drift the install surfaces (record what you landed on
in the roadmap's M0 notes).

## Checks — run after every milestone (and before saying "done")

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # next build — must pass with cacheComponents on
```

Then self-review the diff against the
[review checklist](docs/03-architecture.md#review-checklist), run `npm run dev`
and walk the milestone's "Done when" flow:

- **You verify** what you can: curl the routes (status codes, rendered text),
  query the `dev` DB with a throwaway script, read the `next build` route table
  (static / partial / dynamic), or drive a browser tool if one is available.
- **The human verifies** what needs a real browser (forms, sign-in, cookies —
  mostly M3+). Give them a numbered **click-through script**: URL, what to
  click/type (seed accounts and passwords included), and what they should see.

Report honestly: if a check fails or a step couldn't be verified, say so — never
claim a milestone is done with a failing check.

### End-of-milestone report

Finish every milestone with this, in this order, then stop:

1. **Built** — 3–8 bullets of what now works.
2. **Checks** — typecheck / lint / build result (pass/fail, with the error if
   any) and the build route table for the milestone's routes.
3. **Verified by me** — what you exercised and the evidence.
4. **Please verify** — the click-through script (or "nothing needed").
5. **Decisions & deviations** — anything recorded in the milestone's **Notes**,
   new ADRs, doc fixes.
6. **Not done / not verified** — honestly, or "none".
7. **Merge** — the chunk commits on the milestone branch (`git log --oneline main..`) and the merge-to-`main` request from [End of milestone](#end-of-milestone).

## Git

- One branch per milestone, always created from an up-to-date `main`:
  `m0-boot`, `m1-public-shell`, `m2-read-path`, `m3-auth`, `m4-write-path`,
  `m5-applications-admin`, `m6-polish-deploy`. You may create and switch
  branches. You never merge into `main` — the human does (locally or via a
  GitHub PR).
- **Who commits where:**
  - **Chunk branches — you.** You commit on chunk branches and fast-forward
    them into the milestone branch yourself (see [Chunks](#chunks)).
  - **Milestone branches and `main` — the human.** Never commit directly on a
    milestone branch, never merge a milestone branch into `main`, never push,
    never open PRs (`git push` / `gh pr` are denied in `.claude/settings.json`).
  - **Never add Claude attribution** — no `Co-Authored-By` trailer, no
    "Generated with" line, in commits or anywhere else. Commits use the repo's
    configured git identity. This overrides any default attribution guidance.
  - Conventional messages, scoped to the chunk: `feat(m1): UI primitives and
    design tokens`. Check `.env.local` is never staged; include `migrations/`.
- **All work happens on chunk branches** — a small milestone is simply one
  chunk. So the milestone branch only ever receives fast-forwards from chunks.

### Chunks

Each chunk gets its own branch **cut from the milestone branch**, named
`m<n>-<k>-<slug>` (e.g. `m1-1-ui-primitives`, `m1-2-shell-landing`). Per chunk:

1. `git switch m1-public-shell && git switch -c m1-1-ui-primitives`.
2. Build the chunk. Check off its roadmap items as part of the chunk.
3. Run typecheck / lint / build, plus whatever quick verification the chunk
   allows. All must pass before committing.
4. `git add` the chunk, confirm `.env.local` isn't staged, and commit (no
   attribution trailer).
5. Fast-forward it into the milestone branch and delete it:
   `git switch m1-public-shell && git merge --ff-only m1-1-ui-primitives && git branch -d m1-1-ui-primitives`.
   Only `--ff-only` — never create a merge commit on the milestone branch. If
   it can't fast-forward, stop and ask.
6. Tell the human in a line or two what the chunk did, then cut the next chunk
   from the updated milestone branch. No need to wait between chunks.

### End of milestone

After the last chunk, run the full [checks](#checks--run-after-every-milestone-and-before-saying-done)
and the "Done when" flow on the milestone branch. If that turns up fixes, make
them in one more chunk (e.g. `m1-4-fixes`). Then **stop**: give the
[end-of-milestone report](#end-of-milestone-report) and hand the merge to the
human — e.g. "merge `m1-public-shell` into `main` (PR or
`git switch main && git merge --ff-only m1-public-shell`)". Wait until they
say it's merged, verify with `git log -1 main`, then end the session unless
they ask you to continue.

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
src/auth.ts     Auth.js config (+ DB-free auth.config.ts)   src/proxy.ts   optimistic auth redirect
docs/           brief · data model · architecture · roadmap · conventions · ADRs
```

## Keeping docs true

When you make a real design decision (a trade-off someone could reasonably
choose differently), add an ADR. When code and docs disagree, fix the docs in
the same commit. If this file is stale or the human contradicts it, follow the
human and update this file.
