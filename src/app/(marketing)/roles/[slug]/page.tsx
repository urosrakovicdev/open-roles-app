// Public role detail ("/roles/[slug]"). The shareable, SEO-critical page.
//
// The data is cached in the DAL (getPublicJobBySlug: 'use cache' + cacheTag
// `job-${slug}`) — not on this page; see ADR-0003. Publish/edit actions call
// updateTag to refresh it. Closed Jobs render a "no longer accepting" state
// (ADR-0005); unknown slugs get soft-404 UI (ADR-0004). generateStaticParams
// prebuilds known slugs; generateMetadata gives each Job real <title>/OG tags.
// Docs: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
//       https://nextjs.org/docs/app/api-reference/functions/generate-metadata

import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublicJobBySlug } from "@/data/jobs"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  // TODO: const job = await getPublicJobBySlug(slug); return { title: job.title }
  return { title: slug }
}

// TODO (M2): generateStaticParams (listPublicJobSlugs) + the cached DAL read
// let this page prerender; until then the params read sits behind <Suspense>.
export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense fallback={<main>Loading…</main>}>
      <RoleDetail params={params} />
    </Suspense>
  )
}

async function RoleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const job = await getPublicJobBySlug(slug)
  if (!job) notFound()
  // TODO (M2): render role detail + an "Apply" button (Client Component → Server Action).
  return <main>{/* role: {slug} */}</main>
}
