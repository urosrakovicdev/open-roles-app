// Admin moderation ("/admin"). Admin-only — note this is OUTSIDE the (app)
// group to show a separately-gated section. requireRole('admin') is the wall.
//
// Being outside a group changes the URL, not the
// security model — the check still lives at the data layer, here and in every
// admin Server Action.
// Docs: https://nextjs.org/docs/app/guides/authentication

import { requireRole } from "@/data/dal"

export default async function AdminPage() {
  await requireRole("admin")
  // TODO: list flagged jobs/users; moderation actions (each re-checks admin).
  return <main>{/* admin console */}</main>
}
