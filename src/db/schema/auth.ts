// Auth.js required tables (users, accounts, sessions, verificationTokens) plus
// our app-specific columns on `users` (role). The Drizzle adapter reads/writes
// these. Copy the canonical definitions from the Auth.js Drizzle adapter docs.
//
// Docs: https://authjs.dev/getting-started/adapters/drizzle  ← copy schema from here
//       https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core"

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

// TODO (M2): add the `accounts` table exactly as the Auth.js Drizzle
// adapter docs specify (link above), including its composite primary key.
//
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
