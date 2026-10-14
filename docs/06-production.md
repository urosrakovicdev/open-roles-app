# 06 · Production

How OpenRoles runs in production: Vercel (function region **`fra1`**,
Frankfurt — pinned in [`vercel.json`](../vercel.json), so it's in code, not a
dashboard setting) in front of the Neon project `open-roles` (AWS **eu-central-1**,
Frankfurt), branch **`production`**. The `dev` Neon branch is for local work
only — production never shares it.

## Environment variables

Set in **Vercel → Project → Settings → Environment Variables** (Production
scope). Never prefix any of these with `NEXT_PUBLIC_`; they are read only
through [`src/lib/env.ts`](../src/lib/env.ts), which fails the build or boot
with the names (never the values) of anything missing or malformed.

| Variable          | Required     | Value                                                                                                                                                                                                    |
| ----------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | yes          | Neon **`production`** branch, **pooled** string (host contains `-pooler`).                                                                                                                               |
| `AUTH_SECRET`     | yes          | A **new** secret, not the dev one: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Not `npx auth secret` (it's Better Auth's CLI now).                                    |
| `SITE_URL`        | no           | Public origin, e.g. `https://openroles.example`. Only needed for a custom domain — without it the app uses Vercel's `VERCEL_PROJECT_PRODUCTION_URL`. Feeds `metadataBase`, the sitemap and `robots.txt`. |
| `AUTH_TRUST_HOST` | no on Vercel | Auth.js trusts the host automatically when `VERCEL` is set. **Required** for `next start` anywhere else (including a local production check), or every auth call fails with `UntrustedHost`.             |

Rotating `AUTH_SECRET` signs everyone out (sessions are JWTs signed with it).

## Database migrations

Schema changes ship as SQL files in [`/migrations`](../migrations), generated
with `npm run db:generate` and committed. Apply them to production **before**
deploying the code that needs them — `next build` reads the database
(`generateStaticParams`), so a build against an unmigrated database fails.

```bash
# From a clean checkout of the commit you're about to deploy.
# drizzle.config.ts loads .env.local with dotenv, which does NOT override a
# variable that is already set — so the inline value wins.
DATABASE_URL='<production connection string>' npm run db:migrate
```

- Use the production branch's **direct** (non-pooled) string for migrations
  if you can; the pooled one also works for these small migrations.
- `drizzle-kit migrate` records applied files in `drizzle.__drizzle_migrations`
  and skips them on re-runs, so running it twice is safe.
- **Never** run `npm run db:seed` against production — it deletes every table's
  rows and inserts dev accounts with a known password. **Never** `db:push`.
- An empty production database is fine: `generateStaticParams` falls back to
  placeholder slugs (`no-roles-yet` / `no-companies-yet`), which prerender the
  soft-404.
- There is no UI to create the first Admin (by design — brief). If one is
  needed, promote an existing account in the Neon SQL editor:
  `update "user" set role = 'admin' where email = '…';` — it applies at that
  user's next sign-in.

## Caching on Vercel

`cacheComponents` is on: nothing is cached unless marked `'use cache'`
([ADR-0003](adr/0003-use-cache-lives-in-the-dal.md)). On Vercel the
prerendered pages and `'use cache'` entries live in Vercel's shared cache, so
tag invalidation works across all function instances with no configuration.

| Cached thing                                 | Where                              | Tags                             | Expired by                                        |
| -------------------------------------------- | ---------------------------------- | -------------------------------- | ------------------------------------------------- |
| Job detail                                   | `getPublicJobBySlug`               | `job-${slug}`, `company-${slug}` | Job publish / edit / close / delete; company edit |
| Company profile                              | `getPublicCompanyBySlug`           | `company-${slug}`                | same as above                                     |
| Default Board (`/roles`, no filters, page 1) | `DefaultBoard` in `roles/page.tsx` | `board`                          | any public Job write; company create / edit       |
| Sitemap data                                 | `getSitemapData`                   | `board`                          | same as the Board                                 |

- All lifetimes are `cacheLife("hours")`; tags make writes visible on the next
  request (`updateTag` in Server Actions = read-your-own-writes).
- Filtered / paged Board views, dashboards, admin and every per-visitor
  piece (header account, Apply panel, owner edit link) are dynamic — never
  cached.
- Each deploy starts with a fresh cache; Job and company pages that existed
  at build time are prerendered, newer ones render on first request and are
  cached from then on.

## Observability

[`src/instrumentation.ts`](../src/instrumentation.ts) `onRequestError` logs
every server error (renders, Server Actions, Route Handlers, proxy) as one
JSON line with `message`, `digest`, method, path (no query string), route and
route type — no headers, so no cookies. Find them in **Vercel → Logs**,
filtered by `request_error` or by the `digest` the visitor's error page shows
as "Reference". `register()` is where an OpenTelemetry/APM exporter would go.

## Deploying

1. Migrate the production database (above) if `/migrations` changed.
2. Push / merge to `main` → Vercel builds and deploys.
3. Smoke check on the production URL: Board loads, a Job page loads, sign up
   as an Employer → create company → post and publish a Job (it appears on
   `/roles` immediately) → sign up as a Candidate in another browser → apply
   → the Employer moves the Application to "In review" → the Candidate sees it.

## Self-hosting (not used — for reference)

Vercel handles all of this. Running `next start` on your own servers instead
needs:

- **`AUTH_TRUST_HOST=true`** (see the table above).
- **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** — pinned to the same value on every
  instance and across deploys, so Server Action ids and bound arguments
  encrypted by one instance decrypt on another. Set it as an env var (commented
  in [`.env.example`](../.env.example)).
- **`deploymentId`** in `next.config.ts` — a per-deploy id, so a browser still
  holding the previous build's assets gets a hard navigation instead of
  version-skew errors.
- **`cacheHandler`** (+ `cacheMaxMemorySize: 0`) in `next.config.ts` — a
  shared cache (e.g. Redis) so `'use cache'` entries and tag invalidations are
  shared across instances; the default in-memory cache is per process.

The last two are left as comments in [`next.config.ts`](../next.config.ts).
Docs: https://nextjs.org/docs/app/guides/self-hosting
