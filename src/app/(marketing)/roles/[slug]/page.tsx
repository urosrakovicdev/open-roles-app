// Public role detail ("/roles/[slug]"). The shareable, SEO-critical page.
//
// The data is cached in the DAL (getPublicJobBySlug: 'use cache' + cacheTag
// `job-${slug}`) — not on this page; see ADR-0003. Publish/edit actions call
// updateTag to refresh it. Closed Jobs render a "no longer accepting" state
// (ADR-0005); unknown slugs get soft-404 UI (ADR-0004). generateStaticParams
// prebuilds known slugs; generateMetadata gives each Job real <title>/OG tags.
// Docs: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
//       https://nextjs.org/docs/app/api-reference/functions/generate-metadata

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import { buttonClasses } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { getPublicJobBySlug, listPublicJobSlugs } from "@/data/jobs"
import { employmentTypeLabel, workModeLabel } from "@/lib/job-labels"
import { formatSalary, isPlausibleSlug } from "@/lib/utils"
import { JobPostingJsonLd } from "./_components/job-posting-json-ld"
import { OwnerJobLink } from "./_components/owner-job-link"

type Props = { params: Promise<{ slug: string }> }

// Under cacheComponents this must return at least one param or the build
// fails. On an empty database (first production deploy) a placeholder slug
// prerenders the soft-404 instead.
export async function generateStaticParams() {
  const slugs = await listPublicJobSlugs()
  return slugs.length > 0
    ? slugs.map((slug) => ({ slug }))
    : [{ slug: "no-roles-yet" }]
}

// Malformed slugs never reach the cached read (no junk cache entries).
async function loadJob(slug: string) {
  return isPlausibleSlug(slug) ? getPublicJobBySlug(slug) : null
}

// Shares the page's cache entry — one query per Job, not two.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await loadJob(slug)
  if (!job) return { title: "Role not found" }

  const title = `${job.title} at ${job.companyName}`
  const description = summarize(job.description)
  return {
    title,
    description,
    alternates: { canonical: `/roles/${job.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/roles/${job.slug}`,
      siteName: "OpenRoles",
    },
  }
}

// First paragraph, trimmed to a meta-description length.
function summarize(text: string, max = 160) {
  const first = text.split("\n\n")[0].replace(/\s+/g, " ").trim()
  return first.length <= max ? first : `${first.slice(0, max - 1).trimEnd()}…`
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

// The params read sits inside <Suspense> (instant-navigation validation). For
// prebuilt slugs it still resolves at build time, so the full page is in the
// static HTML; for unknown slugs the shell streams first — hence a 200
// soft-404, as ADR-0004 describes.
export default function RoleDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<RoleDetailSkeleton />}>
      <RoleDetail params={params} />
    </Suspense>
  )
}

function RoleDetailSkeleton() {
  return (
    <main aria-busy="true">
      <Container className="animate-pulse py-10 sm:py-14">
        <div className="h-4 w-20 rounded bg-surface-muted" />
        <div className="mt-8 h-9 w-2/3 rounded bg-surface-muted" />
        <div className="mt-3 h-5 w-1/3 rounded bg-surface-muted" />
        <div className="mt-10 space-y-3">
          <div className="h-4 w-full rounded bg-surface-muted" />
          <div className="h-4 w-5/6 rounded bg-surface-muted" />
          <div className="h-4 w-4/6 rounded bg-surface-muted" />
        </div>
      </Container>
    </main>
  )
}

async function RoleDetail({ params }: Props) {
  const { slug } = await params
  const job = await loadJob(slug)
  if (!job) notFound()

  const facts = [
    { label: "Salary", value: formatSalary(job.salaryMin, job.salaryMax) },
    { label: "Employment type", value: employmentTypeLabel(job.type) },
    { label: "Work mode", value: workModeLabel(job.workMode) },
    { label: "Location", value: job.location ?? "Anywhere" },
  ]

  return (
    <main>
      <JobPostingJsonLd job={job} />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
          <Link href="/roles" className="hover:text-fg">
            ← All roles
          </Link>
        </nav>

        {!job.isAcceptingApplications && (
          <div
            role="status"
            className="mt-6 rounded-card border border-warning/30 bg-warning-soft px-5 py-4 text-sm"
          >
            <p className="font-medium text-fg">
              This role is no longer accepting applications.
            </p>
            <p className="mt-1 text-fg-muted">
              {job.closedAt && <>Closed {dateFormat.format(job.closedAt)}. </>}
              <Link
                href={`/companies/${job.company.slug}`}
                className="font-medium text-brand hover:text-brand-hover"
              >
                See {job.company.name}’s open roles
              </Link>
            </p>
          </div>
        )}

        <header className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {job.title}
          </h1>
          <p className="mt-2 text-fg-muted">
            <Link
              href={`/companies/${job.company.slug}`}
              className="font-medium text-fg hover:text-brand"
            >
              {job.company.name}
            </Link>
            {job.location && <> · {job.location}</>}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="brand">{workModeLabel(job.workMode)}</Badge>
            <Badge>{employmentTypeLabel(job.type)}</Badge>
            {!job.isAcceptingApplications && (
              <Badge tone="warning">Closed</Badge>
            )}
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_18rem]">
          <section aria-labelledby="about-role">
            <h2 id="about-role" className="text-lg font-semibold">
              About the role
            </h2>
            {/* Plain text with paragraphs and • bullets — no HTML from users. */}
            <div className="mt-4 leading-relaxed whitespace-pre-line text-fg">
              {job.description}
            </div>
          </section>

          <aside className="space-y-4">
            <Card>
              <dl className="space-y-3 text-sm">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-fg-muted">{fact.label}</dt>
                    <dd className="font-medium">{fact.value}</dd>
                  </div>
                ))}
                {job.publishedAt && (
                  <div>
                    <dt className="text-fg-muted">Posted</dt>
                    <dd className="font-medium">
                      <time dateTime={job.publishedAt.toISOString()}>
                        {dateFormat.format(job.publishedAt)}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>
              {/* TODO (M5): the Apply action — a dynamic leaf behind
                  <Suspense> (signed out → "Sign in to apply"; candidate → form
                  or "Applied ✓"; Closed → disabled). Never inside this cached
                  data. */}
              {/* Per-visitor, so its own hole; nothing shows while it loads. */}
              <Suspense fallback={null}>
                <OwnerJobLink slug={job.slug} />
              </Suspense>
            </Card>
            <Card>
              <h2 className="text-sm font-semibold">{job.company.name}</h2>
              {job.company.description && (
                <p className="mt-2 line-clamp-4 text-sm text-fg-muted">
                  {job.company.description}
                </p>
              )}
              <Link
                href={`/companies/${job.company.slug}`}
                className={buttonClasses({
                  variant: "secondary",
                  size: "sm",
                  className: "mt-4 w-full",
                })}
              >
                Company profile
              </Link>
            </Card>
          </aside>
        </div>
      </Container>
    </main>
  )
}
