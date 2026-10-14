// Edit a role ("/dashboard/roles/[id]/edit"). Employer-only AND owner-only.
// The [id] in the URL is never trusted on its own: getMyJobById loads it
// scoped to my company, so someone else's Job is a plain 404, exactly like a
// missing one. The form posts to updateJob bound to the same id, which the
// DAL scopes again.
// Docs: https://nextjs.org/docs/app/guides/data-security

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { updateJob } from "@/actions/jobs"
import { JobForm } from "@/components/forms/job-form"
import { Card } from "@/components/ui/card"
import { getMyJobById } from "@/data/jobs"
import { jobIdSchema } from "@/lib/validations/job"

export const metadata: Metadata = { title: "Edit role" }

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const parsed = jobIdSchema.safeParse(id)
  // requireRole("employer") + owner scoping inside getMyJobById.
  const job = parsed.success ? await getMyJobById(parsed.data) : null
  if (!job) notFound()

  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Edit role</h1>
      <p className="mt-1 text-fg-muted">
        {job.isPublic ? (
          <>
            Changes go live on{" "}
            <Link
              href={`/roles/${job.slug}`}
              className="font-medium text-brand hover:text-brand-hover"
            >
              the role’s page
            </Link>{" "}
            as soon as you save. Its URL stays the same.
          </>
        ) : (
          "This draft is private until you publish it."
        )}
      </p>
      <Card className="mt-6">
        <JobForm
          action={updateJob.bind(null, job.id)}
          job={job}
          submitLabel="Save changes"
        />
      </Card>
    </main>
  )
}
