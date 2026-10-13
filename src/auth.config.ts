// The DB-free half of the Auth.js config, shared by src/auth.ts and src/proxy.ts.
//
// The proxy runs on every matched request (prefetches included) and must stay a
// cookie-only, optimistic check — so it builds its own NextAuth instance from
// THIS file, which imports no adapter, no `db` and no bcrypt. src/auth.ts
// spreads it and adds the adapter and the Credentials provider.
//
// Docs: https://authjs.dev/guides/edge-compatibility (split config)
//       https://authjs.dev/guides/role-based-access-control
//       https://nextjs.org/docs/app/guides/authentication#optimistic-checks-with-proxy-optional

import type { NextAuthConfig } from "next-auth"
import { NextResponse } from "next/server"

const PRIVATE_PREFIXES = ["/dashboard", "/admin"]
const AUTH_PAGES = ["/login", "/signup"]

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export const authConfig = {
  // JWT sessions are required by the Credentials provider. The token carries
  // only id + role (docs/03-architecture.md §5).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // added in src/auth.ts — they need the DB
  callbacks: {
    // `user` is only present on sign-in: copy id + role onto the token once.
    jwt({ token, user }) {
      if (user?.id && user.role) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
    // Runs in the proxy only. Optimistic: it reads the (signed) session
    // cookie, never the DB, and is NOT the security boundary — every page and
    // action re-checks through the DAL.
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl
      const signedIn = Boolean(auth?.user?.id)

      if (!signedIn && PRIVATE_PREFIXES.some((p) => matches(pathname, p))) {
        const login = new URL("/login", request.nextUrl)
        // Relative path only — loginAction re-validates it anyway.
        login.searchParams.set("callbackUrl", `${pathname}${search}`)
        return NextResponse.redirect(login)
      }
      if (signedIn && AUTH_PAGES.some((p) => matches(pathname, p))) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
      }
      return true
    },
  },
} satisfies NextAuthConfig
