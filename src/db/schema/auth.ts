// Auth.js tables we need (users, accounts — see the note below for why not
// sessions / verificationTokens / authenticators) plus our app-specific columns
// on `users` (role). The Drizzle adapter reads/writes
// these.
//
// Docs: https://authjs.dev/getting-started/adapters/drizzle
//       https://orm.drizzle.team/docs/sql-schema-declaration

import type { AdapterAccountType } from "next-auth/adapters"
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// A candidate applies to roles; an employer posts them; an admin moderates.
export const userRole = pgEnum("user_role", ["candidate", "employer", "admin"])

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  passwordHash: text("password_hash"), // for the Credentials provider (bcrypt)
  image: text("image"),
  role: userRole("role").notNull().default("candidate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// `accounts` — the Auth.js Drizzle adapter's shape: same Drizzle property
// names, types, nullability, FK and composite primary key as the canonical
// schema (docs/research/auth-drizzle-schema.md §2). The adapter maps by
// PROPERTY name, so the SQL column names follow this repo's snake_case
// convention instead of the docs' camelCase.
export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
)

// We deliberately do NOT create `sessions`, `verificationTokens` or
// `authenticators`:
//  - `sessions` serves the DATABASE session strategy only, and the Credentials
//    provider "can only be used if JSON Web Tokens are enabled for sessions"
//    (https://authjs.dev/reference/core/providers/credentials). It would be
//    created and never written.
//  - `verificationTokens` is for email / magic-link sign-in, which isn't in the
//    product brief.
//  - `authenticators` is for WebAuthn, which the Drizzle adapter doesn't
//    officially support.
// `accounts` is kept even though nothing writes it yet, so that adding an OAuth
// provider later is a config change rather than a migration.
