# 05 · Conventions (where things live)

The folder layout *is* the architecture. When you add code, this table says
where it goes — and the "never" column keeps the boundaries honest.

| If you're writing…                 | Put it in…                         | Never… |
| ---------------------------------- | ---------------------------------- | ------ |
| A page/route                       | `src/app/**`                       | …put DB queries or auth logic inline — call the DAL. |
| A DB read or write                 | `src/data/*.ts` (DAL)              | …import `db` from a component, action or route handler. |
| A mutation entry point             | `src/actions/*.ts`                 | …skip verify/authorize/validate — it's a public endpoint. |
| A DTO + mapper                     | `src/data/dto.ts`                  | …return a raw row to the UI. |
| A table / enum / relation          | `src/db/schema/*.ts`               | …edit the DB by hand — change schema, generate a migration. |
| Input validation                   | `src/lib/validations/*.ts`         | …treat zod as an ownership check (it validates shape only). |
| A UI primitive                     | `src/components/ui/`               | …add `"use client"` unless it needs interactivity. |
| A form (client) wired to an action | `src/components/forms/`            | …do the real work client-side; the server action decides. |
| A page-specific component          | colocate in a `_components/` folder next to the page | …export it for reuse elsewhere — promote it to `src/components/`. |
| A secret / env read                | `src/lib/env.ts`                   | …read `process.env` in client code or prefix a secret `NEXT_PUBLIC_`. |
| Pure helpers                       | `src/lib/utils.ts`                 | …put DB/auth logic there (it's importable from the client). |
| Type augmentation                  | `src/types/*.d.ts`                 | — |
| Observability / startup code       | `src/instrumentation.ts`           | — |

## Naming & style

- **Path alias:** import via `@/…` (maps to `src/`), e.g. `import { db } from "@/db/drizzle"`.
- **Files:** kebab-case (`job-form.tsx`); components PascalCase; DAL functions
  are verbs that say their audience (`listPublishedJobs`, `getMyJobById`).
- **Route groups** `(marketing)` / `(auth)` / `(app)` organize routes without
  adding URL segments. Private folders (`_components`) are never routes.
- **Server by default.** A file is a Server Component unless it starts with
  `"use client"`. Actions start with `"use server"`. DAL / db / env start with
  `import "server-only"`.
- **Action state shape:** `{ ok?: boolean; message?: string; errors?: Record<string, string[]> }`
  — use `z.flattenError` / `.flatten()` (whichever the installed zod provides)
  for field errors.
- **Styling:** Tailwind v4 utilities; tokens in `globals.css` via `@theme`.
  Keep a clean, neutral look; responsive down to 360px.
- **Formatting:** Prettier (`.prettierrc`: no semicolons, double quotes,
  trailing commas). ESLint with `eslint-config-next`.
- **Comments:** each file keeps a short header saying what it is for. Replace
  `TODO (M<n>)` stubs as you implement them; don't leave dead TODOs.
- **No tests** — see `CLAUDE.md`.

## The one rule that prevents most bugs

> Components and actions **call the DAL**; only the DAL touches the database, and
> the DAL is the only place auth and ownership are decided. If you're tempted to
> `import { db }` outside `src/data` or `src/db`, stop.
