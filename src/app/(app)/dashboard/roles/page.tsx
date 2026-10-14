// My roles ("/dashboard/roles"). Employer-only: every Job of my company, in
// any status, with the lifecycle actions (publish a Draft, close a Published
// Job, edit, delete). Dynamic and per-user — never cached.
//
// The row forms post to Server Actions bound to the Job id; each action
// re-checks the Role and the DAL scopes the Job to my company, so a tampered
// id does nothing.
// Docs: https://nextjs.org/docs/app/guides/forms

import type { Metadata } from "next"
import Link from "next/link"
import { closeJob, deleteJob, publishJob } from "@/actions/jobs"
import { Badge, type BadgeTone } from "@/components/ui/badge"
import { buttonClasses } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getMyCompany } from "@/data/companies"
import type { MyJobDTO } from "@/data/dto"
import { listMyJobs } from "@/data/jobs"
import { employmentTypeLabel, workModeLabel } from "@/lib/job-labels"
import { RowActionButton } from "@/components/row-action-button"

export const metadata: Metadata = { title: "My roles" }

const STATUS: Record<MyJobDTO["status"], { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "success" },
  closed: { label: "Closed", tone: "warning" },
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export default async function MyRolesPage() {
  // Both reads open with requireRole("employer").
  const [company, jobs] = await Promise.all([getMyCompany(), listMyJobs()])

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My roles</h1>
          <p className="mt-1 text-fg-muted">
            {company
              ? `Roles posted by ${company.name}.`
              : "Create your company to start posting roles."}
          </p>
        </div>
        <Link
          href={company ? "/dashboard/roles/new" : "/dashboard/company"}
          className={buttonClasses()}
        >
          {company ? "Post a role" : "Create company"}
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border-strong px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No roles yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-fg-muted">
            Start with a draft — it stays private until you publish it to the
            Board.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function JobRow({ job }: { job: MyJobDTO }) {
  const status = STATUS[job.status]
  return (
    <Card as="article" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-medium text-balance">{job.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {employmentTypeLabel(job.type)} · {workModeLabel(job.workMode)}
            {job.location && <> · {job.location}</>}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-subtle">
          {job.publishedAt ? (
            <>Published {dateFormat.format(job.publishedAt)}</>
          ) : (
            <>Updated {dateFormat.format(job.updatedAt)}</>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {job.isPublic && (
            <Link
              href={`/roles/${job.slug}`}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              View
            </Link>
          )}
          <Link
            href={`/dashboard/roles/${job.id}/edit`}
            aria-label={`Edit ${job.title}`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Edit
          </Link>
          {job.status === "draft" && (
            <form action={publishJob.bind(null, job.id)}>
              <RowActionButton
                variant="primary"
                pendingLabel="Publishing…"
                label={`Publish ${job.title}`}
              >
                Publish
              </RowActionButton>
            </form>
          )}
          {job.status === "published" && (
            <form action={closeJob.bind(null, job.id)}>
              <RowActionButton
                pendingLabel="Closing…"
                label={`Close ${job.title}`}
                confirmMessage={`Close “${job.title}”? It leaves the Board and stops accepting applications. Its page stays up.`}
              >
                Close
              </RowActionButton>
            </form>
          )}
          <form action={deleteJob.bind(null, job.id)}>
            <RowActionButton
              variant="ghost"
              pendingLabel="Deleting…"
              label={`Delete ${job.title}`}
              confirmMessage={`Delete “${job.title}” and its applications? This can’t be undone.`}
            >
              Delete
            </RowActionButton>
          </form>
        </div>
      </div>
    </Card>
  )
}
