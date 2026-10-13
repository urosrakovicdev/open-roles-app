// One Job on the Board (and, from M2, on company pages). Server Component that
// renders a JobCardDTO — never a raw row. The title links to the Job's public
// page; the company name links to the company profile.

import Link from "next/link"
import type { JobCardDTO } from "@/data/dto"
import { employmentTypeLabel, workModeLabel } from "@/lib/job-labels"
import { formatSalary } from "@/lib/utils"
import { Badge } from "./ui/badge"
import { Card } from "./ui/card"

// Fixed locale + UTC so server and client always render the same string.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export function JobCard({ job }: { job: JobCardDTO }) {
  return (
    <Card as="article" className="transition-colors hover:border-border-strong">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h2 className="text-base font-semibold">
          <Link href={`/roles/${job.slug}`} className="hover:text-brand">
            {job.title}
          </Link>
        </h2>
        <p className="shrink-0 text-sm text-fg-muted">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </p>
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        <Link href={`/companies/${job.companySlug}`} className="hover:text-fg">
          {job.companyName}
        </Link>
        {job.location && <> · {job.location}</>}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {job.workMode && (
          <Badge tone="brand">{workModeLabel(job.workMode)}</Badge>
        )}
        <Badge>{employmentTypeLabel(job.type)}</Badge>
        {job.publishedAt && (
          <span className="ml-auto text-xs text-fg-subtle">
            Posted{" "}
            <time dateTime={job.publishedAt.toISOString()}>
              {dateFormat.format(job.publishedAt)}
            </time>
          </span>
        )}
      </div>
    </Card>
  )
}
