// THE DATA ACCESS LAYER — session + Role checks.
// server-only: importing this from a Client Component is a build error.
// This is the security boundary — the ONE place auth is verified. Every private
// read in data/* and every mutation in actions/* calls a function here first.
//
// The session is a JWT carrying only id + role. A Role change takes effect on
// the user's next sign-in (docs/03-architecture.md §5).
//
// Docs: https://nextjs.org/docs/app/guides/data-security
//       https://nextjs.org/docs/app/guides/authentication
//       React cache(): https://react.dev/reference/react/cache

import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "./dto"

export type Session = { userId: string; role: UserRole }

// Reads and checks the Auth.js session; null when signed out. Wrapped in React
// cache() so it runs once per request however many callers ask.
const readSession = cache(async (): Promise<Session | null> => {
  // Mark this as request-time work before Auth.js runs: auth() uses
  // crypto.getRandomValues() before it reads cookies, which cacheComponents
  // rejects during prerendering. https://nextjs.org/docs/messages/blocking-prerender-crypto
  await connection()
  const session = await auth()
  const user = session?.user
  if (!user?.id || !user.role) return null
  return { userId: user.id, role: user.role }
})

// verifySession() — authentication. Signed out → /login. Call at the top of
// every private page, private read and Server Action.
export async function verifySession(): Promise<Session> {
  const session = await readSession()
  if (!session) redirect("/login")
  return session
}

// getOptionalSession() — for UI that differs when signed in (the public
// header). Never redirects, and is NOT an authorization check: anything it
// shows must be safe for a signed-out visitor to reach.
export async function getOptionalSession(): Promise<Session | null> {
  return readSession()
}

// requireRole() — authorization. Only the listed Roles pass (an Admin is not
// implicitly an Employer); anyone else is sent to their /dashboard.
export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await verifySession()
  if (!roles.includes(session.role)) redirect("/dashboard")
  return session
}
