// Public job board ("/roles"). Search + filter + pagination via searchParams.
//
// This page mixes a cacheable shell (the layout,
// filters UI) with request-specific results. Wrap the results list in <Suspense>
// so the shell streams instantly while the filtered query runs. Reading
// searchParams opts this boundary into dynamic rendering.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional

import type { Metadata } from "next"
import { Suspense } from "react"
import { JobCard } from "@/components/job-card"
import { RoleFilters } from "@/components/role-filters"
import { Container } from "@/components/ui/container"
import { listPublishedJobs } from "@/data/jobs"
import { parseEmploymentType, parseWorkMode } from "@/lib/job-labels"
import {
  RoleFiltersSkeleton,
  RoleListSkeleton,
} from "./_components/board-skeletons"

export const metadata: Metadata = {
  title: "Browse roles",
  description: "Search open roles by keyword, employment type and work mode.",
}

type RolesSearchParams = Promise<{
  q?: string | string[]
  type?: string | string[]
  workMode?: string | string[]
  page?: string | string[]
}>

export default function RolesPage({
  searchParams,
}: {
  searchParams: RolesSearchParams
}) {
  return (
    <main>
      <Container className="space-y-8 py-10 sm:py-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Browse roles
          </h1>
          <p className="mt-2 text-fg-muted">
            Open roles from companies hiring now.
          </p>
        </div>
        {/* useSearchParams inside → needs its own boundary. */}
        <Suspense fallback={<RoleFiltersSkeleton />}>
          <RoleFilters />
        </Suspense>
        {/* The dynamic hole: results depend on the query string. */}
        <Suspense fallback={<RoleListSkeleton />}>
          <RoleResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  )
}

// A repeated param (?q=a&q=b) arrives as an array — take the first.
function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

async function RoleResults({
  searchParams,
}: {
  searchParams: RolesSearchParams
}) {
  const params = await searchParams
  // URL params are untrusted: unknown filter values are ignored, not passed on.
  const { items } = await listPublishedJobs({
    q: first(params.q),
    type: parseEmploymentType(first(params.type)),
    workMode: parseWorkMode(first(params.workMode)),
    page: Number(first(params.page)) || 1,
  })
  // TODO (M2): pagination controls (page / totalPages) and a designed empty state.

  return (
    <section aria-label="Results" className="space-y-4">
      <p className="text-sm text-fg-muted" aria-live="polite">
        {items.length === 1 ? "1 role" : `${items.length} roles`}
      </p>
      {items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((job) => (
            <li key={job.slug}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-fg-muted">
          No roles match these filters.
        </p>
      )}
    </section>
  )
}
