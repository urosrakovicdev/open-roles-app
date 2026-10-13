// Dashboard home ("/dashboard"). Private, dynamic, per-user.
// Entry point → calls verifySession() at the data layer, not in the layout.
// Docs: https://nextjs.org/docs/app/guides/authentication

import { verifySession } from "@/data/dal"

export default async function DashboardPage() {
  const session = await verifySession() // the real check, at the entry point
  // TODO: branch UI by session.role (candidate vs employer) — show stats/links.
  void session
  return <main>{/* dashboard */}</main>
}
