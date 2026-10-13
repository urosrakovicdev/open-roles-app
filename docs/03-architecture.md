# 03 · Architecture

The "why" behind the file tree. Every change is checked against this doc — see
the [review checklist](#review-checklist) at the bottom.

## 1. Server-first; push the client boundary down

Everything is a **Server Component** by default. `"use client"` appears only on
leaves that truly need interactivity — the search/filter box, the apply form,
the forms in `components/forms/`. Pages, layouts, lists and detail views stay on
the server so they can `await` the DAL and ship no JS.

## 2. The render & caching model is opt-in

`cacheComponents: true` is on (`next.config.ts`). Nothing is cached unless we say
so with `'use cache'`. The plan:

- **Landing** → fully static.
- **Job detail / company pages** → data cached in the DAL
  ([ADR-0003](adr/0003-use-cache-lives-in-the-dal.md)), tagged `job-${slug}` /
  `company-${slug}`, invalidated on edit/publish/close.
- **The Board** (`/roles`) → static shell + results behind `<Suspense>`. The
  parameterless default view may be cached one level up; filtered results are
  dynamic (unbounded args must not be cache keys).
- **Session-dependent bits on public pages** (header user menu, Apply button,
  owner "Edit" link) → small dynamic components behind `<Suspense>`, never inside
  cached functions.
- **Dashboard / admin** → dynamic, per-user, never cached.

## 3. All data goes through a Data Access Layer

[`src/data/`](../src/data) is `server-only`. It is the **only** place that:

- reads/writes the database,
- verifies the session (`verifySession`) and Role (`requireRole`),
- applies ownership scoping,
- returns **DTOs**, never raw rows.

Pages, actions and route handlers call the DAL; they never touch `db` directly.
Public reads take plain serializable args and never a session; owner reads are
separate functions that open with `verifySession()`/`requireRole()`. The status
predicate is never a parameter (no `{ includeDrafts }` flags).

## 4. Mutations are thin Server Actions that delegate

[`src/actions/`](../src/actions) hold `'use server'` functions. Each is a public
POST endpoint, so each one: **verifies → authorizes → validates (zod) → writes
(via the DAL) → revalidates**. Expected errors are **returned** (`{ errors }` /
`{ message }`) for `useActionState`, not thrown.

- For read-your-own-writes (an employer publishing a Job) use `updateTag(tag)` —
  it expires the entry immediately so the next read waits for fresh data.
  `updateTag` is Server-Action-only.
- `revalidateTag(tag, "max")` is for background freshness (also legal in Route
  Handlers). The bare one-arg `revalidateTag(tag)` is deprecated in Next 16.
- The acting user's id always comes from the session, never from form data.

## 5. Auth: optimistic in the proxy, real in the DAL

- `proxy.ts` does the **optimistic**, cookie-only redirect (signed out →
  `/login`). It is *not* the security boundary and never hits the DB
  ([ADR-0004](adr/0004-soft-404-on-unknown-role-slugs.md) relies on this).
- The **real** check is `verifySession()` / `requireRole()` in the DAL, re-run at
  **every** entry point — each page, each Server Action, each Route Handler.
- **Ownership (IDOR):** Role checks aren't enough. Editing a Job loads it scoped
  to the employer's company; Applications are always filtered by the session.
- Sessions are JWT (required by the Credentials provider) and carry only
  `id` + `role`. A Role change takes effect on next sign-in; admin-only actions
  re-read the Role from the DB if that staleness matters.

## 6. Built to deploy and operate

- **Env:** server secrets via `lib/env.ts` (validated, server-only); only
  `NEXT_PUBLIC_*` reaches the client, inlined at build.
- **Self-hosting only:** set `deploymentId`, a shared `cacheHandler`, and pin
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. Not needed on Vercel.
- **Observability:** `instrumentation.ts` is the seam for logging/tracing.
- **Route Handlers** (`/api/webhooks/*`) serve external callers; they verify a
  signature instead of a session.

## The request, end to end

```
Browser
  └─ proxy.ts        optimistic cookie check → maybe redirect
  └─ Server Component (page)
       └─ data/ (DAL)  verifySession + ownership-scoped query
            └─ db (Drizzle → Neon Postgres)
       └─ returns a DTO → renders HTML (+ streams Suspense holes)
  └─ Client leaf (form) → Server Action
       └─ data/ (DAL) verify → validate → write → updateTag
```

## Review checklist

Before calling a milestone done, check the diff for these smells:

- [ ] A hook or event handler in a Server Component.
- [ ] `"use client"` higher than the interactive leaf (e.g. on a page).
- [ ] `import { db }` outside `src/data/` / `src/db/`.
- [ ] A raw Drizzle row (or `passwordHash`) reaching a component.
- [ ] An auth check only in `proxy.ts` or a layout; `return null` as "protection".
- [ ] An owner read/write not scoped by `ownerId` / `candidateId` (IDOR).
- [ ] A user id taken from form data or URL instead of the session.
- [ ] `verifySession()`/`cookies()` inside a `'use cache'` function.
- [ ] Unbounded user input (search text) used as a cache key.
- [ ] `revalidateTag` where the user must see their own write (`updateTag`).
- [ ] A secret in a `NEXT_PUBLIC_` variable or `process.env` read outside `lib/env.ts`.
- [ ] Zod used as if it were an ownership check.
- [ ] Glossary drift ("Role" meaning a Job in code).
