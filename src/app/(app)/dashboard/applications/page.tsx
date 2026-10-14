// Applications ("/dashboard/applications"). The view depends on the Role:
// Candidate → my Applications and their status; Employer → Applications to
// my Jobs. Each view's DAL read scopes by the session itself; the Role check
// here only picks which one to render. Admins have no Applications view.
// Docs: https://nextjs.org/docs/app/guides/data-security

import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonClasses } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { listMyApplications } from "@/data/applications"
import { requireRole } from "@/data/dal"
import { applicationStatusInfo } from "@/lib/application-labels"

export const metadata: Metadata = { title: "Applications" }

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export default async function ApplicationsPage() {
  const session = await requireRole("candidate", "employer")
  return session.role === "candidate" ? (
    <CandidateApplications />
  ) : (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
    </main>
  )
}

async function CandidateApplications() {
  const applications = await listMyApplications()

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>
      <p className="mt-1 text-fg-muted">
        Where each application stands. Employers update the status as they
        review.
      </p>

      {applications.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border-strong px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-fg-muted">
            Find a role you like and apply — it shows up here.
          </p>
          <Link
            href="/roles"
            className={buttonClasses({
              variant: "secondary",
              className: "mt-6",
            })}
          >
            Browse roles
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {applications.map((application) => {
            const status = applicationStatusInfo(application.status)
            return (
              <li key={application.id}>
                <Card
                  as="article"
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2"
                >
                  <div className="min-w-0">
                    <h2 className="font-medium">
                      <Link
                        href={`/roles/${application.job.slug}`}
                        className="hover:text-brand"
                      >
                        {application.job.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      {application.job.companyName} · Applied{" "}
                      {dateFormat.format(application.appliedAt)}
                      {!application.job.isAcceptingApplications &&
                        " · Role closed"}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
