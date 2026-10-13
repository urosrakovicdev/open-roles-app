// Public job board ("/roles"). Search + filter + pagination via searchParams.
//
// This page mixes a cacheable shell (the layout,
// filters UI) with request-specific results. Wrap the results list in <Suspense>
// so the shell streams instantly while the filtered query runs. Reading
// searchParams opts this boundary into dynamic rendering.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional

import type { Metadata } from "next"
import { cacheLife, cacheTag } from "next/cache"
import { Suspense } from "react"
import { RoleFilters } from "@/components/role-filters"
import { Container } from "@/components/ui/container"
import { listPublishedJobs } from "@/data/jobs"
import { parseEmploymentType, parseWorkMode } from "@/lib/job-labels"
import { BoardResults } from "./_components/board-results"
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
  const q = first(params.q)?.trim() || undefined
  const type = parseEmploymentType(first(params.type))
  const workMode = parseWorkMode(first(params.workMode))
  const page = Number(first(params.page)) || 1

  // The plain /roles view (most traffic) is served from one cached entry.
  if (!q && !type && !workMode && page <= 1) {
    return <DefaultBoard />
  }

  // Filtered or paged: dynamic, never cached — q is unbounded (ADR-0003).
  const result = await listPublishedJobs({ q, type, workMode, page })
  return <BoardResults {...result} filters={{ q, type, workMode }} />
}

// ADR-0003 "cached one level up": the Board read stays uncached in the DAL;
// this component calls it with NO arguments, so there is exactly one entry.
// Tag `board` — publishing/closing a Job must updateTag("board") (M4).
async function DefaultBoard() {
  "use cache"
  cacheLife("hours")
  cacheTag("board")
  const result = await listPublishedJobs({})
  return <BoardResults {...result} filters={{}} />
}
