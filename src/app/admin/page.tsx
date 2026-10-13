// Admin moderation ("/admin"). Admin-only — note this is OUTSIDE the (app)
// group to show a separately-gated section. requireRole('admin') is the wall:
// anyone else is redirected to /dashboard.
//
// Being outside a group changes the URL, not the
// security model — the check still lives at the data layer, here and in every
// admin Server Action.
// Docs: https://nextjs.org/docs/app/guides/authentication

import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { requireRole } from "@/data/dal"

export const metadata: Metadata = { title: "Admin console" }

export default async function AdminPage() {
  await requireRole("admin")
  // TODO (M5): list all Jobs (close/delete any) and users (change Role); each
  // moderation action re-checks requireRole("admin").
  return (
    <main>
      <Container className="py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
        <p className="mt-1 text-fg-muted">
          Moderation tools arrive in a later milestone.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
        >
          ← Back to dashboard
        </Link>
      </Container>
    </main>
  )
}
