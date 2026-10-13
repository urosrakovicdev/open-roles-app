// Account settings ("/dashboard/settings"). Profile edit (Server Action),
// password change, etc. Private; verifySession() at the entry point.
// Docs: https://nextjs.org/docs/app/guides/authentication

import { verifySession } from "@/data/dal"

export default async function SettingsPage() {
  await verifySession()
  // TODO: profile form (name, avatar) → an updateProfile Server Action.
  return <main>{/* settings */}</main>
}
