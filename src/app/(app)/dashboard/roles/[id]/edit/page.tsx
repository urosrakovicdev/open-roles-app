// Edit a role ("/dashboard/roles/[id]/edit"). Employer-only AND owner-only.
//
// Role + employer is not enough. You must
// load the job scoped to the signed-in employer's company; if it isn't theirs,
// notFound()/redirect. Never trust the [id] in the URL alone.
// Docs: https://nextjs.org/docs/app/guides/data-security

import { notFound } from "next/navigation"
import { requireRole } from "@/data/dal"

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("employer")
  const { id } = await params
  // TODO: load the job WHERE id = id AND company.ownerId = session.userId.
  // if (!job) notFound()
  void id
  if (!id) notFound()
  return <main>{/* edit role form */}</main>
}
