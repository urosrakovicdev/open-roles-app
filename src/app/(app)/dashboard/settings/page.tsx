// Account settings ("/dashboard/settings"). Any signed-in Role: change your
// name, change your password (the current one is re-checked). The DAL acts on
// the session user only. Email and Role are shown, not editable here.
// Docs: https://nextjs.org/docs/app/guides/authentication

import type { Metadata } from "next"
import { PasswordForm, ProfileForm } from "@/components/forms/settings-forms"
import { Card } from "@/components/ui/card"
import { getMyProfile } from "@/data/account"
import { roleLabel } from "@/lib/role-labels"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const profile = await getMyProfile() // verifySession() inside

  return (
    <main className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-fg-muted">
          Signed in as {profile.email} · {roleLabel(profile.role)}
        </p>
      </div>

      <Card as="section" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="mb-4 font-semibold">
          Profile
        </h2>
        <ProfileForm name={profile.name ?? ""} />
      </Card>

      <Card as="section" aria-labelledby="password-heading">
        <h2 id="password-heading" className="font-semibold">
          Password
        </h2>
        <p className="mt-1 mb-4 text-sm text-fg-muted">
          At least 8 characters.
        </p>
        <PasswordForm />
      </Card>
    </main>
  )
}
