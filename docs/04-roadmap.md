# 04 · Roadmap (the worklist)

Build in thin vertical slices. Each milestone ends in something runnable. Check
items off (`- [x]`) as you go. After each milestone: run the checks in
[`CLAUDE.md`](../CLAUDE.md#checks--run-after-every-milestone-and-before-saying-done),
self-review against the checklist in [`03-architecture.md`](03-architecture.md#review-checklist),
then **ask the human to merge** the milestone into `main`. One milestone per
session, each on its own branch (`m0-boot`, `m1-public-shell`, …); all work
happens on chunk branches cut from it, which the agent commits and
fast-forwards in ([`CLAUDE.md` › Git](../CLAUDE.md#git)). Each milestone ends with the
[end-of-milestone report](../CLAUDE.md#end-of-milestone-report). Record
decisions and deviations in the milestone's **Notes** line.

Vocabulary follows [`CONTEXT.md`](../CONTEXT.md): **Job** = a posting (URL says
`/roles`), **Role** = a user permission.

---

## Setup status (human steps — done 2026-10-13)

No secret values here. Everything below was verified in the setup session.

- **Tooling:** Node 24.1.0 (LTS line), npm 11.3.0, git 2.27 (old but works).
- **Neon:** project `open-roles`, AWS **eu-central-1 (Frankfurt)**, Postgres 18.
  - Branch `production` (default) — **empty, untouched**; reserved for Vercel in M6.
  - Branch `dev` (child of `production`) — what `.env.local` points at. All
    M0–M5 migrations / seeds go here.
- **`.env.local`:** `DATABASE_URL` = **pooled** (`-pooler`) string for the `dev`
  branch, verified with `select 1`; `AUTH_SECRET` set (64 chars). Gitignored.
  `.env.example` lists the same keys with placeholders.
- **Dependencies:** `npm install` done (next 16.4.0, drizzle-orm 0.45.4,
  next-auth 5.0.0-beta.32, @neondatabase/serverless 1.2.0). `npm audit`: 0 issues
  in runtime deps; 9 in dev deps — look at them in M0.
- **Database:** connection proven; public schema empty — no tables or migrations
  yet (that's M0).
- **GitHub:** private repo `urosrakovicdev/open-roles-app` added as `origin`.
  Nothing pushed — the human pushes by hand.
- **Claude Code permissions:** `.claude/settings.json` allows npm scripts and
  install, named `npx` tools, `node`, local `curl`, non-destructive git, and
  fetching the Next.js / Auth.js / Drizzle / Tailwind docs, `git commit` and
  `git merge --ff-only` (chunk branches only — CLAUDE.md › Git).
  Denies `git push`, `gh pr`, `npx auth`, the Neon CLI, and reading `.env.local`.
- **Neon agent skills** (`neon`, `neon-postgres`) installed in `.claude/skills/`
  as reference only — see `CLAUDE.md` › Environment & safety.
- **Skipped / deferred to M6:** Vercel project; set Vercel's function region to
  **`fra1`** (Frankfurt) to match Neon; production `DATABASE_URL` (pooled
  `production` branch) and a **new** production `AUTH_SECRET`, both set in Vercel.
- **Gotcha:** `npx auth secret` now runs **Better Auth's** CLI. It writes
  `BETTER_AUTH_SECRET` and clobbered `.env.example`. Generate secrets with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

---

## M0 · Boot the project

- [x] `npm install` (resolve current versions; fix any drift — e.g. ESLint flat
      config for `eslint-config-next`, `drizzle-orm` major version and its
      relations API, `next-auth` beta API). Record versions in **M0 notes** below.
- [x] **Human step:** create a Neon project, put `DATABASE_URL` in `.env.local`;
      generate `AUTH_SECRET` (see **Setup status** — not `npx auth secret`).
      Done in setup.
- [x] `src/lib/env.ts` validates env; `src/db/drizzle.ts` reads `env.DATABASE_URL`.
- [x] `npm run db:generate && npm run db:migrate` with the starter schema.
- [x] `npm run dev` → the landing page renders; typecheck / lint / build pass.

**Done when:** the app boots, builds, and has migrated a real database.

**M0 notes:**

- **Versions (2026-10-13):** next 16.4.0, react / react-dom 19.3.0, next-auth
  5.0.0-beta.32 (pinned exact — the `beta` tag drifts; `latest` is still v4),
  @auth/drizzle-adapter 1.11.3 (shares @auth/core 0.41.3 with next-auth),
  drizzle-orm 0.45.4 (relations v1 API — `relations()` from `drizzle-orm`),
  drizzle-kit 0.31.11, @neondatabase/serverless 1.2.0, zod 4.6.7, bcryptjs
  3.0.3, tailwindcss + @tailwindcss/postcss 4.3.3, eslint-config-next 16.4.0,
  tsx 4.23.15, prettier 3.9.10, dotenv 18.0.7, @types/node 24 (matches Node 24).
- **Held back on purpose:** TypeScript **6.0.3**, not 7 (typescript-eslint
  needs `<6.1`); ESLint **9**, not 10 (eslint-plugin-react / -import /
  -jsx-a11y peer only up to 9). Revisit when those peers widen.
- **`npm audit`:** 0 in runtime deps; 9 in dev-only tooling (braces via
  eslint-config-next, old esbuild via drizzle-kit). The only "fix" is
  `--force` downgrades — left as is.
- **Next 16.4 drift fixed:** `partialPrefetching: true` set (Next asks for it
  with `cacheComponents`); `next build` rewrote `tsconfig.json`
  (`jsx: react-jsx`, include `.next/dev/types`) — kept.
- **Instant-navigation validation (16.3+)** broke scaffold stubs that read
  request data outside `<Suspense>`. Minimal fixes; the real UI still belongs
  to later milestones:
  - public `/roles`, `/roles/[slug]`, `/companies/[slug]`: the `searchParams` /
    `params` read moved into a child component inside `<Suspense>` (M1/M2
    replace these with the real shell + cached reads);
  - dashboard + admin: a minimal `loading.tsx` in **every** segment
    (`verifySession()` stays at the top of each page). M6 makes them on-brand;
  - `verifySession()` now calls `await connection()` before `auth()`.

  Documented in CLAUDE.md › Known Next 16 facts.

- **Pulled forward from M3 (types only):** `src/types/next-auth.d.ts` declares
  `User.role` so the scaffold `dal.ts` typechecks. M3 still owns the
  jwt/session callbacks that populate it, and the `JWT` augmentation.
- **Env:** `env.ts` validates `DATABASE_URL` as a postgres URL and
  `AUTH_SECRET` ≥ 32 chars; on failure it names the bad keys, never values.
  `drizzle.config.ts` loads dotenv with `quiet: true` (v17+ logs by default).
- **Lint:** `_`-prefixed unused args/vars are allowed (the scaffold stub
  convention). One warning remains by design: unused `db` import in the M5
  stub `data/applications.ts`.
- **DB:** migration `0000_remarkable_luke_cage` applied to Neon `dev`
  (`br-restless-frog-b925mi7k`): user, company, job, application + 4 enums.
- **For later:** the data model lists `job.updatedAt` but the starter schema
  lacks it — add it in M2 with the `workMode` change. Signed-out
  `/dashboard/**` currently returns 200 and redirects in-stream; M3 proxy
  makes it a real redirect.

---

## M1 · Public shell, no data yet

- [x] Tailwind design tokens in `globals.css` (`@theme`: colors, radius, font);
      a small set of UI primitives in `components/ui/` (Button variants, Input,
      Textarea, Select, Label, Card, Badge, Container).
- [x] `(marketing)` layout: header (logo → `/`, "Browse roles" → `/roles`,
      "Post a role" → `/dashboard/roles/new`, "Sign in") + footer.
- [x] Landing page `/`: hero, CTA to browse and to post. Fully static.
- [x] `/roles` with hardcoded Job cards; search/filter UI as a small client leaf
      (`components/role-filters.tsx`) that writes to the URL (`q`, `type`,
      `workMode`, `page`) via `useRouter`/`useSearchParams`.
- [x] Results list wrapped in `<Suspense>` with a skeleton fallback.
- [x] `app/not-found.tsx` and `app/error.tsx` (client) with on-brand UI.

**Done when:** a fast, server-rendered public skin; build output shows `/` as
static and `/roles` as a static shell with a dynamic hole.

**M1 notes:**

- **Chunks:** `m1-1-ui-primitives` (tokens + `components/ui`) →
  `m1-2-shell-landing` (marketing layout, landing, not-found, error) →
  `m1-3-board` (`/roles` hardcoded cards, filters, skeleton).
- **Design tokens:** semantic names only (`canvas`, `surface`, `fg`,
  `fg-muted`, `border`, `brand`, `success` / `warning` / `danger` + `-soft`),
  OKLCH values, neutral cool grays + a calm teal brand. Light theme only (dark
  mode isn't in the brief). Radius tokens `rounded-control` / `rounded-card`.
  Font: Geist via `next/font/google`, mapped to `--font-sans`.
- **Primitives:** Button (+ `buttonClasses()` so a `<Link>` can look like a
  button without nesting `<button>` in `<a>`), Input, Textarea, native Select
  with a chevron, Label, Card (`as` prop for `<article>`), Badge (tones),
  Container (max-w-5xl, 16px gutter). All Server Components; invalid state is
  styled from `aria-invalid`. `cn()` added to `lib/utils.ts` (no
  tailwind-merge dependency — callers don't pass conflicting classes).
- **Shell:** the landing page moved from `app/page.tsx` into `(marketing)/` so
  it shares the header/footer (URL unchanged). Header hides "Post a role" below
  `sm` to fit 360px — the hero CTA covers it. Footer has no copyright year
  (`new Date()` in a static prerender is an unstable value under
  cacheComponents). `components/logo.tsx` is shared by the header and the
  root error / 404 pages, which sit outside `(marketing)` and bring their own
  minimal chrome. `error.tsx` uses `retry()` (16.4 API; `reset()` is the
  fallback) and shows `error.digest` as a reference — built, not triggered.
- **Board:** the hardcoded Jobs live in `data/sample-jobs.ts` and are served by
  the `listPublishedJobs()` stub (filtered + paged in memory), so `/roles`
  already goes page → DAL → `JobCardDTO`; M2 swaps the stub body for a query
  and deletes the sample file. `RoleFilters` is a real GET form to `/roles`
  (works without JS); with JS, selects apply on change and navigation runs in
  a transition. URL params are untrusted: unknown `type` / `workMode` are
  dropped (`lib/job-labels.ts` parsers), repeated params take the first value.
  Both the filters (`useSearchParams`) and the results sit in their own
  `<Suspense>` with layout-matching skeletons. `JobCard` lives in
  `components/` (reused by company pages in M2). Dates render with a fixed
  locale + UTC so server and client agree. Pagination controls and a designed
  empty state stay in M2 (as the roadmap lists them); the result count shows
  the current page's count until M2 returns a total.

---

## M2 · Real data: the read path

- [x] Schema: replace `jobs.remote` text with a `workMode` pgEnum
      (`remote | hybrid | onsite`); add `accounts` exactly per the Auth.js
      Drizzle adapter (see `docs/research/auth-drizzle-schema.md`); **no**
      `sessions` / `verificationTokens` / `authenticators` tables.
- [x] `relations()` for users ↔ companies ↔ jobs ↔ applications (use the
      relations API that matches the installed `drizzle-orm` version — the
      research note was written against 0.38; M0 recorded what is installed).
- [x] Indexes: `job(status, published_at)`, `job(company_id)`,
      `application(candidate_id)`.
- [x] Generate + apply the migration.
- [x] Seed (`db:seed`, idempotent): 1 admin, 2 employers each with a company,
      3 candidates (known dev password, bcrypt-hashed), ~15 Jobs across all
      statuses/types/work modes, a few Applications.
- [x] `data/dto.ts`: `JobCardDTO`, `JobDetailDTO` (with
      `isAcceptingApplications`, **no** `canEdit` — ADR-0003), `CompanyDTO`,
      mappers `toJobCardDTO` / `toJobDetailDTO` / `toCompanyDTO`.
- [x] `data/jobs.ts`:
  - `listPublishedJobs({ q, type, workMode, page })` — **Published** only,
    `ILIKE` on title/company/location, page size 10, returns
    `{ items, page, totalPages }`. **Uncached** (unbounded args — ADR-0003).
  - `getPublicJobBySlug(slug)` — **Published or Closed** (ADR-0005), `'use cache'`
    - `cacheTag(\`job-${slug}\`)`+`cacheLife`, returns DTO or `null`.
  - `listPublicJobSlugs()` for `generateStaticParams`.
- [x] `data/companies.ts`: `getPublicCompanyBySlug(slug)` (cached, tag
      `company-${slug}`) with its Published Jobs.
- [x] Wire `/roles` (default view cached one level up — ADR-0003; filtered view
      dynamic), pagination controls, empty state.
- [x] `/roles/[slug]`: detail, `generateMetadata` (title, description, OG),
      `generateStaticParams`, closed state banner, soft-404 UI (ADR-0004),
      JSON-LD `JobPosting` (with `validThrough` for Closed).
- [x] `/companies/[slug]`: company profile + its open Jobs.

**Done when:** the public board shows seeded Jobs from Postgres with working
search/filter/pagination; detail and company pages are cached.

**M2 notes:**

- **Chunks:** `m2-1-schema` → `m2-2-seed` → `m2-3-dal` → `m2-4-board` →
  `m2-5-detail-pages`.
- **Schema:** `job.work_mode` is a `work_mode` enum, **NOT NULL default
  `onsite`** (every Job has one; the M1 DTO allowed null). Added
  `job.updated_at` (`$onUpdate`), which the data model listed but the starter
  schema lacked. `account` copies the adapter's property names, types, FK and
  composite PK; SQL column names are snake_case like the rest of the schema —
  the adapter maps by property name. `AdapterAccountType` is imported from
  `next-auth/adapters` (re-exports `@auth/core/adapters`; `@auth/core` is only
  a transitive dependency).
- **Relations** (v1 API) live in `schema/relations.ts` — jobs ↔ applications
  would otherwise import each other.
- **Migrations 0001 + 0002:** generated in two steps (add `work_mode`, then
  drop `remote`) because one step makes `drizzle-kit generate` ask
  interactively whether it's a rename. Applied to Neon `dev`. No separate
  index on `application(job_id)`: the unique `(job_id, candidate_id)` index
  already covers it.
- **Seed:** one atomic `db.batch()` (neon-http has no interactive
  transactions; a batch is one transaction) clears all tables in FK order and
  re-inserts, so a failed run keeps the old data. Fixed ids and slugs → stable
  URLs across re-seeds. 6 users (1 admin, 2 employers, 3 candidates), 2
  companies, 17 Jobs — 12 Published (so the Board has a page 2), 2 Closed, 3
  Draft, covering every type and work mode — and 5 Applications (one on a
  Closed Job). Dev password for every account: `openroles-dev` (bcrypt, cost
  10); the seed prints the accounts. Descriptions are plain text with
  paragraphs and `•` bullets — render with `whitespace-pre-line`.
- **DTOs:** `JobCardDTO.workMode` is now non-null (matches the schema).
  `JobDetailDTO` adds `description`, `status` (`published | closed` only),
  `isAcceptingApplications`, `closedAt`, `updatedAt` and the full
  `CompanyDTO`; still **no `canEdit`**. `CompanyDTO` has no `ownerId`.
  `closedAt` is derived from `updated_at` for Closed Jobs (no `closed_at`
  column; closing is the Job's last write) — feeds JSON-LD `validThrough`.
  `toJobDetailDTO` throws on a Draft rather than render it.
- **`listPublishedJobs`:** Drizzle join on company; `ILIKE` on title, company
  name and location with LIKE wildcards escaped and `q` capped at 100 chars;
  count + page in one `db.batch()` round-trip; page past the end → last page.
  Also returns `total`. Uncached (ADR-0003).
- **Cached reads:** `getPublicJobBySlug` (`cacheLife("hours")`, tags
  `job-${slug}` **and** `company-${companySlug}` — the page shows company
  details) and `getPublicCompanyBySlug` (tag `company-${slug}`, Published Jobs
  newest first). `listPublicJobSlugs` / `listPublicCompanySlugs` for
  `generateStaticParams` (uncached, build-time).
- **Caching caveat (ADR-0003):** real slugs are a bounded key space, but junk
  slugs from bots still mint (null) cache entries. Bounded in practice by the
  in-memory LRU; chunk 5 rejects malformed slugs before the cached read.
- **For M6:** under `cacheComponents`, `generateStaticParams` must return at
  least one param — an empty production DB would fail the first build. Chunk 5
  adds a placeholder fallback.
- `data/sample-jobs.ts` (M1) deleted.
- **Board caching (ADR-0003):** plain `/roles` (no filters, page 1) renders
  `DefaultBoard` — a `'use cache'` component that calls `listPublishedJobs()`
  with no arguments (one entry, tag **`board`**, `cacheLife("hours")`). Any
  filter or `page > 1` renders dynamically. Verified: a title changed in the DB
  stays stale on `/roles` and shows at once on `/roles?q=…`. **M4: publishing,
  editing or closing a Job must `updateTag("board")`** as well as the job and
  company tags.
- **Pagination:** Previous / Next links that keep the active filters
  (`scroll={false}`), "Page X of Y", "N roles · showing a–b"; disabled ends
  render as inert spans, not dead links. **Empty states:** "No roles match
  your search" (filters active → Clear filters) vs "No open roles right now"
  (empty Board → Post a role).
- **Detail pages:** `/roles/[slug]` and `/companies/[slug]` prebuild every
  Public Job / company via `generateStaticParams` (○ static, served from the
  prerender cache) and read `params` inside `<Suspense>` with a
  layout-matching skeleton — required by instant-navigation validation; for
  prebuilt slugs the content is still in the static HTML. `generateMetadata`
  (title, description, canonical, Open Graph) shares the page's cached read.
  Slugs failing `isPlausibleSlug()` never reach the cached read.
- **ADR-0004 confirmed in practice:** unknown slugs, Drafts and malformed
  slugs render the segment's `not-found.tsx` inside the site layout with
  **200 + `noindex`**. (Briefly, with `params` awaited outside `<Suspense>`,
  they returned a real 404 — but dev validation rejects that structure, so
  the ADR's reasoning holds.)
- **Empty-DB guard:** `generateStaticParams` falls back to a placeholder slug
  (`no-roles-yet` / `no-companies-yet`) — under `cacheComponents` an empty
  array fails the build, which would break the first M6 deploy.
- **Job page:** closed banner (with closing date + link to the company's open
  roles), facts card, company card, description as plain text
  (`whitespace-pre-line`, no user HTML). JSON-LD `JobPosting` (employment
  type mapped, `TELECOMMUTE` for remote, USD `baseSalary`, `validThrough`
  for Closed) with `<` escaped per the Next.js JSON-LD guide. Apply and the
  owner "Edit" affordance are left as a TODO slot for M5 / M4 — dynamic
  leaves, never in the cached DTO.
- **Seed:** sets `updated_at` explicitly so Closed Jobs have a realistic
  closing date (posted N days ago, closed 30 days later).
- No `metadataBase` yet: canonical / `og:url` are relative, which Next
  resolves against the deployment URL on Vercel. Revisit in M6 if a custom
  domain is used.

---

## M3 · Auth

- [x] `lib/validations/auth.ts`: `signupSchema` (name, email, password ≥ 8,
      role ∈ candidate|employer — never admin), `loginSchema`.
- [x] `data/users.ts`: `getUserForCredentials(email)` (returns id, role,
      passwordHash — used only by `auth.ts`), `createUser(input)`.
- [x] `auth.ts`: Credentials `authorize` (zod → DAL lookup → `bcrypt.compare`);
      `jwt` + `session` callbacks carry `id` and `role`; `DrizzleAdapter` given
      the custom `usersTable` / `accountsTable`; JWT strategy.
- [x] `src/types/next-auth.d.ts` module augmentation for `session.user.role`.
- [x] `data/dal.ts`: `verifySession()` (redirects to `/login`),
      `getOptionalSession()` (no redirect, for header UI),
      `requireRole(...roles)`.
- [x] `actions/auth.ts`: `signupAction` (duplicate email → field error),
      `loginAction` (catch `AuthError` → friendly message, respect
      `callbackUrl`), `logoutAction`.
- [x] Client forms `components/forms/{login,signup}-form.tsx` with
      `useActionState`, field errors, pending state.
- [x] `proxy.ts`: redirect signed-out users from `/dashboard/**` and `/admin/**`
      to `/login?callbackUrl=…`; redirect signed-in users away from
      `/login`/`/signup`. Cookie-only, no DB.
- [x] Marketing header shows "Dashboard / Sign out" when signed in (dynamic
      leaf behind `<Suspense>` so the rest of the shell stays static).
- [x] `(app)` layout: dashboard nav that adapts to role; still not a security
      boundary — every page calls the DAL.

**Done when:** you can sign up as candidate or employer, log in/out, and reach
the role-aware `/dashboard`; `/admin` bounces non-admins.

**M3 notes:**

- **Chunks:** `m3-1-auth-core` → `m3-2-auth-forms` → `m3-3-session-ui`.
- **Split Auth.js config:** `src/auth.config.ts` holds the DB-free part (JWT
  strategy, `jwt` / `session` callbacks, the proxy's `authorized` rules);
  `src/auth.ts` spreads it and adds the adapter + Credentials. `proxy.ts`
  builds its own `NextAuth(authConfig)`, so it never imports `db` or bcrypt —
  the "cookie-only" rule is structural, not a convention. Next's build
  statically looks for a `proxy` export and doesn't see one in
  `export const { auth: proxy } = …`; an export specifier
  (`export { auth as proxy }`) works.
- **Proxy matcher** narrowed to `/dashboard/:path*`, `/admin/:path*`,
  `/login`, `/signup` (was every route) — public pages never run it.
  `callbackUrl` is the relative path + query string.
- **`requireRole(...roles)`:** only the listed Roles pass; an Admin is **not**
  implicitly an Employer (the M0 stub let admins through everything). Failing
  it redirects to `/dashboard`.
- **`UserRole`** type lives in `data/dto.ts` (derived from the schema); the
  Auth.js augmentation imports it. The JWT augmentation targets
  `@auth/core/jwt` — `next-auth/jwt` only re-exports it.
- **Emails** are trimmed + lowercased by the zod schemas (seed emails are
  lowercase). Passwords: 8–72 chars (bcrypt ignores bytes past 72).
- **`createUser`** hashes in the DAL (bcrypt cost 10, same as the seed) and
  uses `ON CONFLICT (email) DO NOTHING` → `email_taken`, so a signup race
  can't surface as a 500.
- **Auth actions:** state shape `{ message?, errors?, fields? }` — `fields`
  echoes name / email / role (never the password) so a failed submit keeps
  the form filled. Login shows one "Invalid email or password." for unknown
  email and wrong password alike. `callbackUrl` is honoured only for same-site
  relative paths (`/x` yes; `//x`, `/\x`, absolute URLs → `/dashboard`).
  Signup starts the session and lands on `/dashboard` (no callbackUrl).
- **Auth pages:** new `(auth)/layout.tsx` (wordmark + centred card, no site
  nav). `/signup` is fully static; `/login` is a static shell with the form
  behind `<Suspense>` because it reads `?callbackUrl` — streamed as server
  HTML, so both forms submit without JS. Both are `noindex`. Shared
  `components/forms/field-error.tsx` links messages via `aria-describedby`.
- **Header:** `HeaderAccount` (`getOptionalSession()`) behind `<Suspense>`
  with a neutral placeholder — no "Sign in" flash for signed-in visitors.
  Sign-out is a `<form action={logoutAction}>` (POST, works without JS).
  Consequence: every marketing page is now ◐ instead of ○ — the content is
  still in the prerendered HTML (checked for `/` and a prebuilt Job page);
  only the account corner streams.
- **Dashboard chrome:** `(app)` layout = top bar (wordmark + Sign out) and a
  Role-aware `DashboardNav` behind `<Suspense>` (no top-level session read in
  the layout). Nav lists only routes that exist today — Candidate: Overview,
  My applications, Settings; Employer: + Post a role, Applications; Admin:
  Overview, Admin console, Settings. **M4:** add "My roles"
  (`/dashboard/roles`) and "Company" to the Employer nav. Active link via a
  small client `NavLink` (`aria-current`).
- **`/dashboard`:** Role-aware quick-link cards (M5 adds the stats).
  **`/admin`:** heading + back link; non-admins are redirected to
  `/dashboard` by `requireRole("admin")` (streamed redirect — the status is
  200 because `loading.tsx` has already started the response).
- Shared `lib/role-labels.ts` for Role display names.

---

## M4 · The write path: companies & Jobs

- [x] `/dashboard/company`: employer creates/edits their Company
      (`upsertMyCompany`; slug from name, unique). Employers without a company
      are routed here before posting.
- [x] `lib/validations/job.ts`: `jobSchema` (title, description, location,
      type, workMode, salaryMin ≤ salaryMax refinement); empty strings → undefined.
- [x] `data/jobs.ts` owner functions (all open with `requireRole("employer")`
      and scope by `company.ownerId = session.userId`):
      `listMyJobs`, `getMyJobById`, `createJobForMyCompany`,
      `updateMyJob`, `setMyJobStatus`, `deleteMyJob`.
- [x] `actions/jobs.ts`: `createJob`, `updateJob`, `publishJob`, `closeJob`,
      `deleteJob` — verify → authorize → validate → write → `updateTag(\`job-${slug}\`)`    /`updateTag(\`company-${slug}\`)` + refresh the board.
- [x] `components/forms/job-form.tsx` shared by new/edit.
- [x] `/dashboard/roles` (my Jobs table with status badges + actions),
      `/dashboard/roles/new`, `/dashboard/roles/[id]/edit` (owner-scoped;
      `notFound()` if not theirs).
- [x] Owner-only "Edit this Job" affordance on `/roles/[slug]` as a separate
      dynamic component behind `<Suspense>` (ADR-0003 — never in the cached DTO).
- [x] Slugs: `slugify(title)` + short random suffix; immutable after publish.

**Done when:** an employer creates a company, posts a draft, publishes it, and
sees it live on the board and detail page immediately (read-your-writes); closing
it removes it from the board but keeps the detail page with the closed banner.

**M4 notes:**

- **Chunks:** `m4-1-company` → `m4-2-job-writes` → `m4-3-job-ui` →
  `m4-4-owner-edit-link`.
- **Company:** `getMyCompany` / `upsertMyCompany` in `data/companies.ts`
  (`requireRole("employer")`, owner from the session). The schema allows
  several companies per owner; the UI manages the **oldest** one. Slug =
  `slugify(name)` at creation, random suffix only if taken (`ON CONFLICT DO
NOTHING` + retry, no read-then-write race), and it **never changes** —
  renaming keeps the public URL. Blank optional fields clear the column.
  Website / logo URLs must be `http(s)` (they end up in public `href`s).
  `saveCompanyAction` → `updateTag(company-${slug})` + `updateTag("board")`
  (Board cards show the company name). Employers without a company are sent
  to `/dashboard/company?from=new-role`; a hidden `next=new-role` (allowlist,
  not a URL) continues to "Post a role" after creating.
- **Cache tag vocabulary** now lives in the DAL: `BOARD_TAG` / `jobTag()` in
  `data/jobs.ts`, `companyTag()` in `data/companies.ts`; the cached reads and
  the actions both use them.
- Shared zod helpers `lib/validations/fields.ts` (`optionalText`,
  `optionalHttpUrl`: blank → `undefined`). `makeSlug()` in `lib/utils.ts`.
- **`jobSchema`** (renamed from the stub's `createJobSchema`): title 3–120,
  description 20–10,000, optional location ≤ 120, enums, optional whole-number
  salaries 0–10M (annual USD; "120,000" accepted), `salaryMin ≤ salaryMax`
  error on `salaryMax`.
- **Owner Job DAL:** every function reaches a Job through
  `company.ownerId = session.userId`; someone else's id is indistinguishable
  from a missing one. `MyJobDTO` (any status, with `id` and editable fields).
  Writes return the public tags they affect (`job-${slug}`,
  `company-${slug}`, `board`) and the action calls `updateTag` on each —
  Draft edits/deletes touch none. Lifecycle is **Draft → Published →
  Closed** only (no reopen, no unpublish — not in the brief); the expected
  current status is in the `UPDATE … WHERE`, so double submits are no-ops.
  `publishedAt` is stamped on publish.
- **Slugs:** `slugify(title)` + 6-char random suffix (unique index + retry).
  The slug follows title edits only while `publishedAt` is null (never
  public); after the first publish it is frozen.
- **Row actions** (`publishJob` / `closeJob` / `deleteJob`) are plain
  `(jobId) => void` form actions bound to the id, ending in `refresh()` so the
  dashboard list re-renders; failures are silent no-ops (the list shows the
  real state). `createJob` without a company redirects to the company page.
- **Dashboard UI:** `JobForm` takes the action as a prop (`createJob`, or
  `updateJob.bind(null, id)`) and echoes fields on error. New Jobs are
  always saved as a Draft ("Save draft"); publishing is a row action on My
  roles. My roles is a card list rather than a `<table>` (fits 360px):
  status badge, View (Public Jobs), Edit, Publish (Draft) / Close
  (Published), Delete. Close and Delete ask `confirm()` in a small client
  `RowActionButton` (also shows pending); without JS they submit directly.
  `/dashboard/roles/new` redirects employers without a company.
  `/dashboard/roles/[id]/edit` → `notFound()` for another employer's Job.
- **Nav:** Employer = Overview, My roles, Company, Applications, Settings.
  "Post a role" left the nav (it highlighted together with My roles); it's
  the primary button on My roles and a dashboard quick link.
- **Owner link on `/roles/[slug]`:** `OwnerJobLink` behind its own
  `<Suspense fallback={null}>` inside the facts card, fed by
  `getMyJobIdBySlug(slug)` — uncached, uses `getOptionalSession()` (no
  redirect; anyone may view the page), returns an id only to the owning
  Employer. Visible copy says "Edit this role" (URL-facing wording); the
  cached `JobDetailDTO` is unchanged.
- **Verified against `next start`** (not just dev): publish → Board, company
  page and detail page show the Job on the next request; close → gone from
  Board and company page, detail shows the closed banner; editing a Job whose
  page was prerendered at build time updates it. Dev DB re-seeded afterwards.
- **For M6:** `next start` locally fails every auth call with Auth.js
  `UntrustedHost` unless `AUTH_TRUST_HOST=true` is set (Vercel sets it
  automatically). Used inline for the check above; `.env.local` untouched.

---

## M5 · Applications & admin

- [ ] `lib/validations/application.ts` (coverLetter ≤ 5000; resumeUrl optional URL).
- [ ] `data/applications.ts`: `applyToJob` (candidate only, Job must be
      Published, unique per pair → friendly "already applied"),
      `listMyApplications`, `listApplicationsForMyJobs`,
      `setApplicationStatus` (employer owns the Job), `hasApplied(jobSlug)`.
- [ ] `actions/applications.ts`: thin wrappers; candidateId from session.
- [ ] Apply UI on `/roles/[slug]`: dynamic leaf behind `<Suspense>` — signed
      out → "Sign in to apply"; candidate → form or "Applied ✓"; employer/admin
      → hidden; Closed → disabled.
- [ ] `/dashboard/applications`: candidate view (status per Job) / employer view
      (grouped by Job, status select).
- [ ] `/dashboard` home: role-aware stats (counts) and quick links.
- [ ] `/dashboard/settings`: update name; change password (verify current).
- [ ] `/admin` (`requireRole("admin")`): list all Jobs (close/delete any), list
      users (change role). Each admin action re-checks the role.

**Done when:** the full two-sided flow works with ownership enforced: candidate
applies → employer sees it and changes status → candidate sees the new status.

**M5 notes:** _(decisions, deviations, out-of-scope findings)_

---

## M6 · Polish, deploy, operate

- [ ] Loading states (`loading.tsx` or Suspense fallbacks) on dashboard routes;
      accessible forms (labels, `aria-invalid`, focus on first error).
- [ ] `app/sitemap.ts` (Public Jobs + companies) and `app/robots.ts`.
- [ ] `instrumentation.ts`: minimal `onRequestError` logging.
- [ ] `next.config.ts` production notes stay commented (self-hosting only).
- [ ] **Human step:** create the Vercel project, set env vars
      (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST` if needed), deploy;
      run migrations against the prod DB.
- [ ] Production smoke check of the M5 flow on the deployed URL.
- [ ] `docs/06-production.md`: env, migrations, caching on Vercel, and where
      `deploymentId` / `cacheHandler` / `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` go
      if self-hosted.

**Done when:** the app is deployed and the two-sided flow works in production.

**M6 notes:** _(decisions, deviations, out-of-scope findings)_

---

## Stretch (optional — only after M6, only if the human asks)

- Featured-role payment via Stripe Checkout + the `/api/webhooks/stripe` Route
  Handler (verify signature on the raw body).
- Resume upload (e.g. Vercel Blob) replacing `resumeUrl` text input.
- Email the employer on a new Application via `after()`.
- OAuth login (GitHub) — `accounts` table already exists.
- Optimistic "Applied" state with `useOptimistic`.
