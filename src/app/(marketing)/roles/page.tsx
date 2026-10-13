// Public job board ("/roles"). Search + filter + pagination via searchParams.
//
// This page mixes a cacheable shell (the layout,
// filters UI) with request-specific results. Wrap the results list in <Suspense>
// so the shell streams instantly while the filtered query runs. Reading
// searchParams opts this boundary into dynamic rendering.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional

import { Suspense } from "react"
import { listPublishedJobs } from "@/data/jobs"

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  return (
    <main>
      {/* TODO: <RoleFilters /> (a Client Component for the search box) */}
      <Suspense fallback={<p>Loading roles…</p>}>
        {/* TODO: render <RoleList /> from this promise */}
        {await (async () => {
          await listPublishedJobs({ q, page: Number(page) || 1 })
          return null
        })()}
      </Suspense>
    </main>
  )
}
