// Auth.js v5 (NextAuth) — the single source of auth configuration.
// Exports `handlers` (for the API route), `signIn`/`signOut` (call from Server
// Actions), and `auth()` (read the session on the server).
//
// `auth()` is wrapped by the DAL (src/data/dal.ts → verifySession) so every
// read/mutation goes through one audited entry point. Credential lookup goes
// through a DAL helper (data/users.ts), not `db` directly — the adapter wiring
// below is the one place `db` is handed to Auth.js.
//
// The DB-free part (session strategy, callbacks, proxy rules) lives in
// src/auth.config.ts so the proxy can use it without importing the database.
//
// Docs: https://authjs.dev/getting-started/installation
//       https://authjs.dev/getting-started/adapters/drizzle
//       https://authjs.dev/getting-started/authentication/credentials

import { DrizzleAdapter } from "@auth/drizzle-adapter"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "@/auth.config"
import { getUserForCredentials } from "@/data/users"
import { db } from "@/db/drizzle"
import { accounts, users } from "@/db/schema"
import { loginSchema } from "@/lib/validations/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // Our own tables (custom `role` / `passwordHash` columns). No sessions or
  // verificationTokens tables — JWT sessions, no magic links (docs/02-data-model.md).
  // Credentials users aren't persisted through the adapter; it's here so an
  // OAuth provider later is a config change, not a migration.
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts }),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      // Returning null → Auth.js throws CredentialsSignin; loginAction turns
      // that into one generic "invalid email or password" message.
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await getUserForCredentials(parsed.data.email)
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        )
        if (!valid) return null

        // Becomes `user` in the jwt callback — never the hash.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
})
