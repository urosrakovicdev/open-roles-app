// Admin moderation ("/admin"). Admin-only — note this is OUTSIDE the (app)
// group to show a separately-gated section. The wall is the DAL: every read
// here and every admin Server Action goes through requireFreshAdmin(), which
// re-checks the Role in the database, not just the JWT. Anyone else is
// redirected to /dashboard.
//
// Two lists: every Job (close a Published one, delete any) and every user
// (change their Role — not your own). In this console Jobs are called "Jobs",
// not "roles", because user Roles are on the same page (CONTEXT.md).
// Docs: https://nextjs.org/docs/app/guides/authentication

import type { Metadata } from "next"
import Link from "next/link"
import {
  adminCloseJob,
  adminDeleteJob,
  adminSetUserRole,
} from "@/actions/admin"
import { RowActionButton } from "@/components/row-action-button"
import { Badge, type BadgeTone } from "@/components/ui/badge"
import { buttonClasses } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Select } from "@/components/ui/select"
import {
  listAllJobs,
  listUsers,
  type AdminJobDTO,
  type AdminUserDTO,
} from "@/data/admin"
import { ROLE_OPTIONS, roleLabel } from "@/lib/role-labels"

export const metadata: Metadata = {
  title: "Admin console",
  robots: { index: false },
}

const JOB_STATUS: Record<
  AdminJobDTO["status"],
  { label: string; tone: BadgeTone }
> = {
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

export default async function AdminPage() {
  const [jobs, users] = await Promise.all([listAllJobs(), listUsers()])

  return (
    <main>
      <Container className="space-y-10 py-10">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-fg-muted hover:text-fg"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Admin console
          </h1>
          <p className="mt-1 text-fg-muted">
            Moderate Jobs across every company and manage user Roles.
          </p>
        </div>

        <section id="jobs" aria-labelledby="jobs-heading">
          <h2 id="jobs-heading" className="text-lg font-semibold">
            Jobs{" "}
            <span className="font-normal text-fg-muted">({jobs.length})</span>
          </h2>
          <ul className="mt-3 space-y-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobRow job={job} />
              </li>
            ))}
          </ul>
        </section>

        <section id="users" aria-labelledby="users-heading">
          <h2 id="users-heading" className="text-lg font-semibold">
            Users{" "}
            <span className="font-normal text-fg-muted">({users.length})</span>
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            A Role change applies the next time that user signs in.
          </p>
          <ul className="mt-3 space-y-3">
            {users.map((user) => (
              <li key={user.id}>
                <UserRow user={user} />
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </main>
  )
}

function JobRow({ job }: { job: AdminJobDTO }) {
  const status = JOB_STATUS[job.status]
  return (
    <Card
      as="article"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <h3 className="font-medium">{job.title}</h3>
        <p className="mt-1 text-sm text-fg-muted">
          {job.companyName} ·{" "}
          {job.applicationCount === 1
            ? "1 application"
            : `${job.applicationCount} applications`}{" "}
          · Updated {dateFormat.format(job.updatedAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        {job.status !== "draft" && (
          <Link
            href={`/roles/${job.slug}`}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            View
          </Link>
        )}
        {job.status === "published" && (
          <form action={adminCloseJob.bind(null, job.id)}>
            <RowActionButton
              pendingLabel="Closing…"
              label={`Close ${job.title}`}
              confirmMessage={`Close “${job.title}” (${job.companyName})? It leaves the Board; its page stays up.`}
            >
              Close
            </RowActionButton>
          </form>
        )}
        <form action={adminDeleteJob.bind(null, job.id)}>
          <RowActionButton
            variant="danger"
            pendingLabel="Deleting…"
            label={`Delete ${job.title}`}
            confirmMessage={`Delete “${job.title}” (${job.companyName}) and its applications? This can’t be undone.`}
          >
            Delete
          </RowActionButton>
        </form>
      </div>
    </Card>
  )
}

function UserRow({ user }: { user: AdminUserDTO }) {
  const name = user.name ?? user.email
  return (
    <Card
      as="article"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <h3 className="font-medium">
          {name}
          {user.isMe && (
            <span className="font-normal text-fg-muted"> (you)</span>
          )}
        </h3>
        <p className="mt-1 text-sm break-all text-fg-muted">
          {user.email} · Joined {dateFormat.format(user.createdAt)}
        </p>
      </div>
      {user.isMe ? (
        // Changing your own Role is refused by the DAL; don't offer it.
        <Badge tone="brand">{roleLabel(user.role)}</Badge>
      ) : (
        <form
          action={adminSetUserRole.bind(null, user.id)}
          className="flex items-center gap-2"
        >
          <div className="w-36">
            <Select
              name="role"
              defaultValue={user.role}
              aria-label={`Role for ${name}`}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <RowActionButton
            pendingLabel="Saving…"
            label={`Save Role for ${name}`}
            confirmMessage={`Change ${name}’s Role?`}
          >
            Save
          </RowActionButton>
        </form>
      )}
    </Card>
  )
}
