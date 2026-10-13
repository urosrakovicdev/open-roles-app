# Auth.js v5 + Drizzle schema — primary-source research

**Date:** 2026-09-08
**Purpose:** Answer 7 specific questions about the exact tables/columns/relations needed for `@auth/drizzle-adapter` with Auth.js v5 (Credentials + Postgres/Neon), and the exact `relations()` API surface in `drizzle-orm@0.38` — **before** writing `src/db/schema/`. Every claim below is backed by a fetched primary-source page (authjs.dev or orm.drizzle.team), quoted verbatim, with the exact URL. Two places fall back to the `nextauthjs/next-auth` GitHub source (disclosed explicitly, inline) because the live docs page renders that specific content client-side (a tabbed/accordion component) and isn't present in the static HTML my fetch tools receive — I verified the GitHub-hosted file is the literal source the docs site builds from, not a stand-in for it.

> **Side note, not one of the 7 questions, but material to this project's timeline:** every authjs.dev page currently carries a banner: *"The Auth.js project is now part of [Better Auth](https://www.better-auth.com/)."* (seen on e.g. `https://authjs.dev/getting-started/adapters/drizzle`). Auth.js v5 / `@auth/drizzle-adapter` are still fully documented and installable today, so nothing below is invalidated — but this is worth knowing for the long term.

---

## 1. Credentials provider + session strategy

**Answer: JWT-only.** The Credentials provider cannot be used with the `"database"` session strategy. If you configure it, sessions must use `strategy: "jwt"` (which is also the default whenever no `adapter` is set). The `sessions` table should be **omitted from the schema entirely** if Credentials is your only provider and you have no other reason to run database sessions — it isn't "created but unused," the adapter setup docs explicitly document it as an *optional* table you don't need to define at all.

**Primary quote (the core constraint):**

> "The Credentials provider allows you to handle signing in with arbitrary credentials, such as a username and password, domain, or two factor authentication or hardware device (e.g. YubiKey U2F / FIDO). [...] It comes with the constraint that users authenticated in this manner are not persisted in the database, and consequently that the Credentials provider can only be used if JSON Web Tokens are enabled for sessions."

Source: <https://authjs.dev/reference/core/providers/credentials> (this is the typedoc-rendered form of the JSDoc on the `Credentials` provider function; I confirmed the exact sentence is live on that page).

**Sessions table is optional / opt-out, not "created but unused":**

> "The `sessionsTable` is optional and only required if you're using the database session strategy."

Source: <https://authjs.dev/getting-started/adapters/drizzle> (section "Passing your own Schemas").

Same point, stated generally (any provider, not just Credentials):

> "Even if you are using a database, you can still use **JWT** for session handling for fast access, in which case, this model can be opted out in your database."

Source: <https://authjs.dev/concepts/database-models#session>

**A documented tension worth flagging explicitly (per the ground rules — I'm not silently picking a side):** the Database Models page also says, in a different section:

> "User creation in the database is automatic and happens when the user is logged in for the first time with an authentication provider (either OAuth, magic links or plain credentials)."

Source: <https://authjs.dev/concepts/database-models#user>

This reads as if Credentials-authenticated users *are* persisted via the adapter, which is in tension with the Credentials provider reference page's explicit "not persisted in the database." My read: the Credentials-provider statement is the more authoritative and specific one (it's describing the provider's actual constraint, in the provider's own reference doc), and the Database Models sentence is a generic/slightly stale summary that doesn't account for the Credentials special case. Docs do not reconcile this explicitly — flagging as a genuine discrepancy rather than resolving it silently.

**Practical implication for this project:** OpenRoles uses Credentials + a `passwordHash` column (per `docs/02-data-model.md`) and says "the session payload stays minimal — id + role only," which strongly implies JWT strategy was already the intended design. This research confirms that's not just a preference but a requirement: Credentials + database sessions is not a supported combination, so plan on `session: { strategy: "jwt" }` and no `sessions` table.

---

## 2. The canonical Drizzle adapter schema

**Retrieval note:** `https://authjs.dev/getting-started/adapters/drizzle` renders its "Schemas" section as a client-side accordion (PostgreSQL / MySQL / SQLite tabs); the schema code is not present in the static HTML my fetch tools receive. I confirmed the exact content by reading the MDX source file the docs site is generated from: `https://github.com/nextauthjs/next-auth/blob/main/docs/pages/getting-started/adapters/drizzle.mdx` (same repo, same page — this is the literal source of that live page, disclosed per the ground rules since it required a GitHub read to see the code).

**Full, current PostgreSQL schema exactly as shown (verbatim code block):**

```ts filename="schema.ts"
import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import type { AdapterAccountType } from "@auth/core/adapters"

const connectionString = "postgres://postgres:postgres@localhost:5432/drizzle"
const pool = postgres(connectionString, { max: 1 })

export const db = drizzle(pool)

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
)
```

Source: <https://authjs.dev/getting-started/adapters/drizzle> (content verified via `docs/pages/getting-started/adapters/drizzle.mdx` in the `nextauthjs/next-auth` repo, main branch, as described above).

**Yes — `authenticators` is now documented in the default Drizzle schema**, for WebAuthn/Passkeys support. Table name `"authenticator"`, composite PK on `(userId, credentialID)`, unique constraint on `credentialID`.

**Adapter setup / "Passing your own Schemas" (this is where the per-table optionality is stated):**

```ts filename="auth.ts"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, accounts, sessions, users, verificationTokens } from "./schema"

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
})
```

> "If you want to use your own tables, you can pass them as a second argument to `DrizzleAdapter`."
> "The `sessionsTable` is optional and only required if you're using the database session strategy."
> "The `verificationTokensTable` is optional and only required if you're using a Magic Link provider."

Source: <https://authjs.dev/getting-started/adapters/drizzle> ("Passing your own Schemas" section, static HTML — this part **is** present without needing the GitHub fallback).

**`DrizzleAdapter` function signature (reference page):**

> `function DrizzleAdapter<SqlFlavor>(db, schema?): Adapter`

Source: <https://authjs.dev/reference/drizzle-adapter>

**Which tables each Auth.js feature actually requires**, cross-referenced from the adapter-authoring guide's breakdown of adapter *methods* (grouped by feature) — this is the clearest primary-source statement of "what's actually required, not just what's in the starter schema":

> "Auth.js adapters are very flexible, and you can implement only the methods you need, and only create the database tables/columns that are actually going to be used."

Source: <https://authjs.dev/guides/creating-a-database-adapter>

That page groups adapter methods (and therefore required tables) like this:

- **User management** (`users` + `accounts` tables) — methods: `createUser`, `getUser`, `getUserByAccount`, `updateUser`, `linkAccount`. This group backs **OAuth** sign-in and is also what Auth.js calls when linking any account to a user.
- **Database session management** (`sessions` table) — methods: `createSession`, `getSessionAndUser`, `updateSession`, `deleteSession`. Quote: *"If you want to use database sessions, you will need to implement the following methods."* → only needed when `session.strategy === "database"`.
- **Verification tokens** (`verificationTokens` table) — methods: `getUserByEmail`, `createVerificationToken`, `useVerificationToken`. Quote: *"When you want to support email/passwordless login, Auth.js uses a database to store temporary verification tokens..."* → only needed for the Email/magic-link provider.

Source (all three quotes above): <https://authjs.dev/guides/creating-a-database-adapter>

The generic database landing page reinforces this:

> "Please note, that the entire schema is not required for every use-case, for more details check out our database adapters guide."

Source: <https://authjs.dev/getting-started/database>

**WebAuthn/`authenticators` — an important caveat the ground rules ask me to flag rather than paper over.** The Drizzle adapter's documented schema (above) includes an `authenticators` table, and the live adapter source code (`packages/adapter-drizzle/src/lib/pg.ts` on `nextauthjs/next-auth`, main branch) implements `getAuthenticator`, `listAuthenticatorsByUserId`, `updateAuthenticatorCounter`, etc. — so the package itself supports WebAuthn. **However**, the dedicated WebAuthn getting-started guide currently states:

> "The WebAuthn provider requires changes to all of the framework integration as well as any database adapter that plans to support it. Therefore, the WebAuthn provider is currently only supported in the following framework integration and database adapters. Support for more frameworks and adapters are coming soon.
> - `next-auth@5.0.0-beta.8` or above
> - `@auth/prisma-adapter@1.3.0` or above
> - `node@20.0.0` or above"

Source: <https://authjs.dev/getting-started/authentication/webauthn>

So: the Drizzle adapter schema *documents* the `authenticators` table (parity with other adapters), but the official "supported adapters" list for the WebAuthn provider names only `@auth/prisma-adapter`. Docs don't reconcile this; treat it as **not officially supported with Drizzle today**, table or no table — not relevant to this project anyway since M-whatever roadmap doesn't call for passkeys.

**Summary table of feature → required tables:**

| Feature | Tables required |
|---|---|
| Credentials only (JWT strategy) | none of the adapter tables are required by Auth.js itself (Credentials doesn't persist via the adapter) — but see note below |
| OAuth (any strategy) | `users`, `accounts` |
| OAuth + database sessions | `users`, `accounts`, `sessions` |
| Email/magic-link | `users`, `verificationTokens` (`accounts` too, per the ER diagrams, since a magic-link sign-in also creates an Account row) |
| WebAuthn/Passkeys | `authenticators` (+ `users`) — but not officially supported on `@auth/drizzle-adapter` per the guide above |

Note on "Credentials only": since Auth.js won't be persisting Credentials-authenticated users through the adapter mechanism at all, you don't strictly need a Drizzle adapter or a `users`/`accounts` table *for Auth.js's sake*. In practice this project will still have its own `users` table (for `passwordHash`, `role`, ownership FKs, etc.) — that's just app data, decoupled from whether `DrizzleAdapter` is even configured.

---

## 3. Custom columns on `users`

**Yes, tolerated — and documented as by-design, generically:**

> "Auth.js can be used with any database. Models tell you what structures Auth.js expects from your database. Models will vary slightly depending on which adapter you use, but in general, will have a similar structure to the graph below. **Each model can be extended with additional fields.**"

Source: <https://authjs.dev/reference/core/adapters> (also identical wording at <https://authjs.dev/concepts/database-models>)

There's no dedicated guide titled "extending the users table with a role/passwordHash column" — docs are silent on that exact scenario — but the general "each model can be extended with additional fields" statement, plus the fact that `DrizzleAdapter(db, schema)` takes your own table objects (see Q2), is the documented mechanism: you own the `pgTable("user", {...})` call, Auth.js only reads/writes the columns it knows about (`id`, `name`, `email`, `emailVerified`, `image`), and anything else you add (e.g. `role: userRoleEnum("role")`, `passwordHash: text("passwordHash")`) is simply never touched by the adapter.

**`id` column type/default — no hard "must" in prose, but a consistent documented pattern plus a real code-level mechanism:**

- The `AdapterUser` TypeScript interface (which every adapter's `createUser`/`getUser`/etc. must satisfy) declares:
  > `id: string`
  Source: `packages/core/src/adapters.ts` in `nextauthjs/next-auth` (this interface backs <https://authjs.dev/reference/core/adapters#adapteruser>) — so whatever column type you pick, its TypeScript-facing value must be a `string`.
- Every officially documented starter schema (Postgres, MySQL, SQLite — see Q2) uses the same pattern: `text("id")` (or `varchar("id", { length: 255 })` for MySQL) `.primaryKey().$defaultFn(() => crypto.randomUUID())`. Docs never say "the id column *must* have a default generator," but 100% of the documented examples use one.
- **GitHub-source fallback, disclosed:** the actual `@auth/drizzle-adapter` implementation (`packages/adapter-drizzle/src/lib/pg.ts`, `createUser` method) doesn't hard-require a default — it inspects the column at runtime:
  ```ts
  async createUser(data: AdapterUser) {
    const { id, ...insertData } = data
    const hasDefaultId = getTableColumns(usersTable)["id"]["hasDefault"]

    return client
      .insert(usersTable)
      .values(hasDefaultId ? insertData : { ...insertData, id })
      .returning()
      .then((res) => res[0]) as Awaitable<AdapterUser>
  }
  ```
  If your `id` column has a Drizzle-level default (`.$defaultFn(...)`, `.default(...)`, `default gen_random_uuid()`, etc.), the adapter omits `id` from the insert and lets the column generate it. If it doesn't, the adapter falls back to inserting the `id` value Auth.js itself already generated internally. Either way works; docs are silent on this specific mechanism (it's implementation detail, not documented prose), so I'm citing the source directly rather than guessing.

**Bottom line for this project:** a `role` enum column and a `passwordHash` column on `users` are fine and unremarkable to the adapter — they're simply extra columns it never selects/inserts by name. Keep `id` as `text` (or `uuid`) with a default generator to match every documented example and to get the "adapter omits it from insert" code path.

---

## 4. Adapter + JWT together

**Yes — the adapter is still used, for user/account persistence and account linking, even when `session.strategy` is `"jwt"`.** The only adapter methods that go dark under JWT sessions are the *session*-table CRUD methods.

**Adapter is configured independently of session strategy; JWT can be forced even with an adapter present:**

> "Choose how you want to save the user session. The default is `"jwt"`, an encrypted JWT (JWE) in the session cookie. **If you use an `adapter` however, we default it to `"database"` instead. You can still force a JWT session by explicitly defining `"jwt"`.**"

Source: <https://authjs.dev/reference/core> (`AuthConfig.session.strategy` doc comment)

**The adapter-authoring guide splits methods into groups, and only one group is session-strategy-dependent** — this is the clearest evidence that user/account persistence keeps running under JWT:

> User management methods (always invoked, regardless of session strategy): `createUser`, `getUser`, `getUserByAccount`, `updateUser`, `linkAccount`. ("Not yet invoked by Auth.js: `deleteUser`, `unlinkAccount`.")
>
> Database session management methods ("If you want to use database sessions, you will need to implement the following methods"): `createSession`, `getSessionAndUser`, `updateSession`, `deleteSession`.

Source: <https://authjs.dev/guides/creating-a-database-adapter>

**Account linking specifically keeps working under an adapter regardless of session strategy:**

> "Account creation in the database is automatic and happens when the user is logged in for the first time with an authentication provider (either OAuth, magic links or plain credentials) or the `Adapter.linkAccount` method is invoked."
> "Linking `Account`(s) to `User`(s) happen automatically, only when they have the same e-mail address, and the user is currently signed in."

Source: <https://authjs.dev/concepts/database-models#account>

**Module-level summary of what an adapter is for**, which frames this whole answer:

> "Auth.js can be integrated with any data layer (database, ORM, or backend API, HTTP client) in order to automatically create users, handle account linking automatically, support passwordless login, and to store session information."
> "Auth.js supports 2 session strategies to persist the login state of a user. The default is to use a cookie + JWT based session store (`strategy: "jwt"`), but you can also use a database adapter to store the session in a database."

Source: <https://authjs.dev/reference/core/adapters> (module doc comment)

**Practical implication for this project:** since OAuth providers aren't part of the current roadmap (Credentials only, per `docs/02-data-model.md`), this mostly matters as forward-looking context — but if OAuth is ever added later while keeping JWT sessions (e.g. for edge-runtime compatibility), the adapter's `users`/`accounts` tables and account-linking behavior will still be exercised; only `sessions` stays unused.

---

## 5. Drizzle `relations()` in 0.38

**`drizzle-orm@0.38.0` is unambiguously on "Relations API v1"** — the `relations()` helper with `one()`/`many()` and `fields`/`references`. Confirmed via the npm registry:

- `drizzle-orm@0.38.0` release date: **2024-12-09** (`registry.npmjs.org/drizzle-orm`, `time["0.38.0"]`).
- Current npm dist-tags (checked live, 2026-09-08): `"latest": "0.45.2"` and `"rc": "1.0.0-rc.4"`. In other words, the entire `0.x` line — including both `0.38.0` and today's `latest` (`0.45.2`) — predates the "Relations API v2" rewrite, which ships only starting with the `1.0.0-beta`/`1.0.0-rc` pre-release line (install today via `drizzle-orm@rc`), **not yet the `latest` stable tag**.

**Canonical v1 one-to-many example (exact code from the docs, users/posts — maps conceptually to this project's company/jobs, i.e. one company has many jobs):**

```ts
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: text('name'),
});

export const usersRelations = relations(users, ({ many }) => ({
	posts: many(posts),
}));

export const posts = pgTable('posts', {
	id: serial('id').primaryKey(),
	content: text('content'),
	authorId: integer('author_id'),
});

export const postsRelations = relations(posts, ({ one }) => ({
	author: one(users, {
		fields: [posts.authorId],
		references: [users.id],
	}),
}));
```

Source: <https://orm.drizzle.team/docs/singlestore/relations> — page `<title>` is literally **"Drizzle ORM - [OLD] Drizzle Relations"**. This page is still live and dialect-specific (SingleStore hasn't migrated to the v2 relational-query API), which makes it the correct version-matched reference for `0.38`. I additionally confirmed the identical "Foreign keys" prose (see Q6) is still present, byte-for-byte, on the *current, non-OLD, non-dialect-suffixed* page `https://orm.drizzle.team/docs/relations` — so the v1 syntax quoted above is not some abandoned corner of the docs, it's exactly what you'd write against `0.38` today.

Mapped to this project's domain (illustrative, not literal — this is what the equivalent would look like for `company`/`job`):

```ts
export const companiesRelations = relations(companies, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
}));
```

**A newer "Relations API v2" does exist — confirm version and migration path:**

> "Migrating to Relational Queries version 2" — install via `npm i drizzle-orm@rc` / `npm i drizzle-kit@rc -D`.
> "The first difference is that you no longer need to specify `relations` for each table separately in different objects and then pass them all to `drizzle()` along with your schema. In Relational Queries v2, you now have one dedicated place to specify all the relations for all the tables you need."

Source: <https://orm.drizzle.team/docs/relations-v1-v2>

v2's syntax (for contrast — **not** what `0.38` uses):

```ts
// relations.ts
import * as schema from "./schema"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}))
```

Source: <https://orm.drizzle.team/docs/relations-v1-v2> and <https://orm.drizzle.team/docs/relations> (both show this exact `defineRelations`/`r.one`/`r.many`/`from`/`to` shape). Note the renamed options: v1's `fields`/`references` become v2's `from`/`to`.

Migration path documented: either automated (`drizzle-kit pull`, which "supports pulling `relations.ts` file in a new syntax") or manual rewrite, per <https://orm.drizzle.team/docs/relations-v1-v2>.

**Conclusion for this project:** since the pinned version is `drizzle-orm@^0.38.0` (well inside the `0.x`/stable-`latest` line, nowhere near the `@rc` tag), **v1's `relations()`/`one()`/`many()`/`fields`/`references` is the correct and only-supported API** — do not use `defineRelations`, it doesn't exist in `0.38` and isn't even on the default install today. No migration is relevant unless/until the project later upgrades past `drizzle-orm@1.0.0`.

---

## 6. Do `relations()` calls affect the SQL/migrations?

**Confirmed: no.** `relations()` is purely a TypeScript-level construct for the `db.query.*` relational-query API. It generates no SQL/DDL and does not create foreign keys. A `.references()` call inside a column definition is the thing that actually produces a FK constraint in generated migrations.

**Exact quote (relations vs. foreign keys):**

> "You might've noticed that `relations` look similar to foreign keys — they even have a `references` property. So what's the difference? While foreign keys serve a similar purpose, defining relations between tables, they work on a different level compared to `relations`. Foreign keys are a database level constraint, they are checked on every `insert`/`update`/`delete` operation and throw an error if a constraint is violated. **On the other hand, `relations` are a higher level abstraction, they are used to define relations between tables on the application level only. They do not affect the database schema in any way and do not create foreign keys implicitly.** What this means is `relations` and foreign keys can be used together, but they are not dependent on each other. You can define `relations` without using foreign keys (and vice versa), which allows them to be used with databases that do not support foreign keys."

Source: <https://orm.drizzle.team/docs/singlestore/relations#foreign-keys> (the `0.38`-matched "[OLD]" page). Identical wording also verified live at the current, non-dialect page <https://orm.drizzle.team/docs/relations#foreign-keys> — so this is stable guidance across both the old and current docs, not something that changed between v1 and v2.

**Contrast — `references()` in a column definition *does* generate real migration DDL.** Exact code + generated-SQL pair from the docs:

```ts
import { serial, text, integer, pgTable } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: serial("id"),
  name: text("name"),
});

export const book = pgTable("book", {
  id: serial("id"),
  name: text("name"),
  authorId: integer("author_id").references(() => user.id)
});
```

generates:

```sql
CREATE TABLE "user" (
	"id" serial,
	"name" text
);

CREATE TABLE "book" (
	"id" serial,
	"name" text,
	"author_id" integer
);

ALTER TABLE "book" ADD CONSTRAINT "book_author_id_user_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id");
```

Source: <https://orm.drizzle.team/docs/indexes-constraints#foreign-key>

**Bottom line for this project's schema:** put `.references(() => companies.id)` on `jobs.companyId` (and similarly for other FKs) to get the actual Postgres constraint in the generated migration — that's non-negotiable for data integrity. Then, *separately*, write `relations()` blocks purely to unlock `db.query.jobs.findMany({ with: { company: true } })`-style ergonomic reads. The two are independent and you need both for this project (real FK for integrity + `relations()` for query ergonomics), matching the docs' explicit "can be used together, but are not dependent on each other."

---

## 7. `db.query.*` prerequisites

**Confirmed: the `schema` option is required, and it must include both the table objects *and* the `relations()` outputs — typically via `import * as schema from './schema'` (a wildcard/barrel import that re-exports everything, tables and relations alike) passed into `drizzle(client, { schema })`.**

**Exact quote (the clearest, most direct statement of this):**

> "## Querying
> Relational queries are an extension to Drizzle's original **query builder**. You need to provide all `tables` and `relations` from your schema file/files upon `drizzle()` initialization and then just use the `db.query` API."

Source: <https://orm.drizzle.team/docs/singlestore/rqb#querying> (the `0.38`-matched "old" relational-queries doc, same generation as the `[OLD]` relations page from Q5/Q6).

**The setup pattern shown alongside that quote** (single schema file):

```ts
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/...';

const db = drizzle({ schema });

await db.query.users.findMany(...);
```

...and for multiple schema files, spread them together into one `schema` object:

```ts
import * as schema1 from './schema1';
import * as schema2 from './schema2';
import { drizzle } from 'drizzle-orm/...';

const db = drizzle({ schema: { ...schema1, ...schema2 } });

await db.query.users.findMany(...);
```

Source: same page, <https://orm.drizzle.team/docs/singlestore/rqb>. The docs' own schema.ts example directly above this snippet exports *both* the tables (`export const users = ...`, `export const posts = ...`) and their relations (`export const usersRelations = relations(users, ...)`, `export const postsRelations = relations(posts, ...)`) from the same file — so `import * as schema from './schema'` naturally sweeps up both kinds of exports into the single object handed to `drizzle()`. There is no special second option for relations; they live in the same `schema` bag as the tables.

**This is a general instruction, not old-API-specific** — the current (v2, `defineRelations`) docs describe the identical requirement, just with the relations object coming from `defineRelations` instead of individual `relations()` calls, and the setup call still being `drizzle(client, { schema })`. So regardless of API version, the shape of the requirement is: **one `schema` object, containing tables + relations, passed once to `drizzle()`.**

**Practical implication for this project's barrel file:** if `src/db/schema/` has one file per area (`user.ts`, `company.ts`, `job.ts`, `application.ts`) plus per-file `relations()` exports, the `src/db/index.ts` (or wherever `drizzle()` is called) needs something like:

```ts
import * as schema from "./schema" // a barrel that does `export * from "./user"` etc. for every file
import { drizzle } from "drizzle-orm/postgres-js"

export const db = drizzle(client, { schema })
```

If the barrel only re-exports the table objects and forgets to re-export the `relations()` calls (or vice versa), `db.query.jobs.findMany({ with: { company: true } })` will not know about the `company` relation — the docs' wording ("provide all tables **and** relations ... upon `drizzle()` initialization") makes both halves a hard requirement, not just the tables.

---

## Sources consulted (full list)

- <https://authjs.dev/reference/core/providers/credentials>
- <https://authjs.dev/getting-started/adapters/drizzle>
- <https://authjs.dev/reference/drizzle-adapter>
- <https://authjs.dev/getting-started/database>
- <https://authjs.dev/guides/creating-a-database-adapter>
- <https://authjs.dev/getting-started/authentication/webauthn>
- <https://authjs.dev/reference/core/adapters>
- <https://authjs.dev/reference/core>
- <https://authjs.dev/concepts/database-models>
- <https://authjs.dev/concepts/session-strategies>
- <https://orm.drizzle.team/docs/singlestore/relations> (`[OLD]` v1 relations page — version-matched to `0.38`)
- <https://orm.drizzle.team/docs/relations> (current stable relations page)
- <https://orm.drizzle.team/docs/relations-v1-v2> (v1→v2 migration guide)
- <https://orm.drizzle.team/docs/indexes-constraints>
- <https://orm.drizzle.team/docs/singlestore/rqb> (`0.38`-matched relational queries doc)
- <https://orm.drizzle.team/docs/rqb> (current stable relational queries doc)
- `registry.npmjs.org/drizzle-orm` and `registry.npmjs.org/@auth/drizzle-adapter` (npm registry metadata, for version/release-date facts, not prose claims)
- GitHub fallback, disclosed inline above: `nextauthjs/next-auth` — `docs/pages/getting-started/adapters/drizzle.mdx` (source of the schema code block in Q2), `packages/core/src/adapters.ts`, `packages/core/src/index.ts`, `packages/core/src/providers/credentials.ts`, `packages/adapter-drizzle/src/lib/pg.ts` (source of the `hasDefault` mechanism in Q3), `docs/pages/guides/creating-a-database-adapter.mdx`, `docs/pages/concepts/database-models.mdx`, `docs/pages/getting-started/authentication/webauthn.mdx`
