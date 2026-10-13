// THE DATA ACCESS LAYER.
// server-only: importing this from a Client Component is a build error.
// This is the security boundary — the ONE place auth is verified. Every read in
// data/* and every mutation in actions/* calls a function here first.
//
// Docs: https://nextjs.org/docs/app/guides/data-security
//       https://nextjs.org/docs/app/guides/authentication
//       React cache(): https://react.dev/reference/react/cache

import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/auth"

// verifySession() — the project's single auth function.
// Wrapped in React cache() so it runs once per request no matter how many
// callers (Server Components, Actions, Route Handlers) invoke it.
export const verifySession = cache(async () => {
  // Mark this as request-time work before Auth.js runs: auth() uses
  // crypto.getRandomValues() before it reads cookies, which cacheComponents
  // rejects during prerendering. https://nextjs.org/docs/messages/blocking-prerender-crypto
  await connection()
  const session = await auth() // Auth.js
  if (!session?.user?.id) redirect("/login") // authentication
  return { userId: session.user.id, role: session.user.role }
})

// requireRole() — authorization. Call at the top of role-gated reads/actions.
export const requireRole = cache(async (role: "employer" | "admin") => {
  const session = await verifySession()
  if (session.role !== role && session.role !== "admin") redirect("/dashboard")
  return session
})

// TODO (M3): once the session callback carries `role`, type
// session.user.role properly (module augmentation in a next-auth.d.ts).
