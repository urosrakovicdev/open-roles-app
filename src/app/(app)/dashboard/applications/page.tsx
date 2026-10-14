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
import { setApplicationStatusAction } from "@/actions/applications"
import {
  listApplicationsForMyJobs,
  listMyApplications,
} from "@/data/applications"
import { requireRole } from "@/data/dal"
import type { ReceivedApplicationDTO } from "@/data/dto"
import { applicationStatusInfo } from "@/lib/application-labels"
import { StatusSelect } from "./_components/status-select"

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
    <EmployerApplications />
  )
}

async function EmployerApplications() {
  const groups = await listApplicationsForMyJobs()

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
      <p className="mt-1 text-fg-muted">
        Candidates who applied to your roles. Changing a status updates what the
        candidate sees.
      </p>

      {groups.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border-strong px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-fg-muted">
            When candidates apply to your published roles, they show up here.
          </p>
          <Link
            href="/dashboard/roles"
            className={buttonClasses({
              variant: "secondary",
              className: "mt-6",
            })}
          >
            My roles
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map(({ job, applications }) => (
            <section key={job.id} aria-labelledby={`job-${job.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`job-${job.id}`} className="text-lg font-semibold">
                  <Link
                    href={`/roles/${job.slug}`}
                    className="hover:text-brand"
                  >
                    {job.title}
                  </Link>
                </h2>
                <p className="text-sm text-fg-muted">
                  {applications.length === 1
                    ? "1 application"
                    : `${applications.length} applications`}
                  {job.status === "closed" && " · Role closed"}
                </p>
              </div>
              <ul className="mt-3 space-y-3">
                {applications.map((application) => (
                  <li key={application.id}>
                    <ReceivedApplication application={application} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function ReceivedApplication({
  application,
}: {
  application: ReceivedApplicationDTO
}) {
  const name = application.candidate.name ?? application.candidate.email
  return (
    <Card as="article" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h3 className="font-medium">{name}</h3>
          <p className="mt-1 text-sm break-all text-fg-muted">
            <a
              href={`mailto:${application.candidate.email}`}
              className="hover:text-brand"
            >
              {application.candidate.email}
            </a>{" "}
            · Applied {dateFormat.format(application.appliedAt)}
          </p>
        </div>
        <form action={setApplicationStatusAction.bind(null, application.id)}>
          <StatusSelect
            id={`status-${application.id}`}
            status={application.status}
            label={`Status for ${name}`}
          />
        </form>
      </div>
      {application.coverLetter && (
        <p className="text-sm leading-relaxed whitespace-pre-line text-fg">
          {application.coverLetter}
        </p>
      )}
      {application.resumeUrl && (
        <a
          href={application.resumeUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-block text-sm font-medium text-brand hover:text-brand-hover"
        >
          Résumé ↗
        </a>
      )}
    </Card>
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
