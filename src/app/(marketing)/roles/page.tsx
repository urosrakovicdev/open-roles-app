// Public job board ("/roles"). Search + filter + pagination via searchParams.
//
// This page mixes a cacheable shell (the layout,
// filters UI) with request-specific results. Wrap the results list in <Suspense>
// so the shell streams instantly while the filtered query runs. Reading
// searchParams opts this boundary into dynamic rendering.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional

import { Suspense } from "react"
import { listPublishedJobs } from "@/data/jobs"

type RolesSearchParams = Promise<{ q?: string; page?: string }>

export default function RolesPage({
  searchParams,
}: {
  searchParams: RolesSearchParams
}) {
  return (
    <main>
      {/* TODO (M1): <RoleFilters /> (a Client Component for the search box) */}
      <Suspense fallback={<p>Loading roles…</p>}>
        <RoleResults searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

// The dynamic hole: searchParams is read here, inside <Suspense>, so the page
// shell above stays static.
async function RoleResults({
  searchParams,
}: {
  searchParams: RolesSearchParams
}) {
  const { q, page } = await searchParams
  await listPublishedJobs({ q, page: Number(page) || 1 })
  // TODO (M1/M2): render <RoleList /> from the result.
  return null
}
