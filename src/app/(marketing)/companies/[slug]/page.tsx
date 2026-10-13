// Public company profile ("/companies/[slug]") — the company + its open roles.
// Another cacheable public page. Demonstrates a second dynamic
// segment and reusing the same DAL reads.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

import { Suspense } from "react"
import { notFound } from "next/navigation"

// TODO (M2): generateStaticParams + the cached DAL read let this page
// prerender; until then the params read sits behind <Suspense>.
export default function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense fallback={<main>Loading…</main>}>
      <CompanyProfile params={params} />
    </Suspense>
  )
}

async function CompanyProfile({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // TODO: fetch the company by slug + its published jobs (DAL). notFound() if missing.
  if (!slug) notFound()
  return <main>{/* company: {slug} */}</main>
}
