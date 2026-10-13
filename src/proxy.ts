// proxy.ts — Next.js 16 middleware (was middleware.ts pre-16).
// Runs on every matched request, including prefetches.
//
// This is the OPTIMISTIC auth tier. It only reads the signed session cookie
// for a fast redirect — no database, and NOT the security boundary. The real
// check is re-run in the DAL at every entry point. The rules live in the
// `authorized` callback in src/auth.config.ts:
//  - signed out on /dashboard/** or /admin/** → /login?callbackUrl=…
//  - signed in on /login or /signup → /dashboard
//
// It builds its own NextAuth instance from the DB-free config, so nothing here
// imports the adapter, `db` or bcrypt.
//
// Docs: https://authjs.dev/guides/edge-compatibility
//       https://nextjs.org/docs/app/api-reference/file-conventions/proxy

import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

// An export specifier: Next statically checks for a `proxy` export, and
// doesn't see one inside a destructuring declaration.
export { auth as proxy }

// Only the routes the rules above care about — public pages never pay for it.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
}
