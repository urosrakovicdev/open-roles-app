// Public company profile ("/companies/[slug]") — the company + its open roles.
// Another cacheable public page: the data comes from getPublicCompanyBySlug
// ('use cache', tag `company-${slug}`) in the DAL (ADR-0003).
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { JobCard } from "@/components/job-card"
import { Container } from "@/components/ui/container"
import {
  getPublicCompanyBySlug,
  listPublicCompanySlugs,
} from "@/data/companies"
import { isPlausibleSlug } from "@/lib/utils"

type Props = { params: Promise<{ slug: string }> }

// Must return at least one param under cacheComponents — see roles/[slug].
export async function generateStaticParams() {
  const slugs = await listPublicCompanySlugs()
  return slugs.length > 0
    ? slugs.map((slug) => ({ slug }))
    : [{ slug: "no-companies-yet" }]
}

async function loadCompany(slug: string) {
  return isPlausibleSlug(slug) ? getPublicCompanyBySlug(slug) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const profile = await loadCompany(slug)
  if (!profile) return { title: "Company not found" }
  const { company, jobs } = profile
  const description =
    company.description ??
    `${company.name} is hiring on OpenRoles — ${jobs.length} open roles.`
  return {
    title: `${company.name} — open roles`,
    description,
    alternates: { canonical: `/companies/${company.slug}` },
    openGraph: {
      type: "website",
      title: `${company.name} on OpenRoles`,
      description,
      url: `/companies/${company.slug}`,
      siteName: "OpenRoles",
    },
  }
}

// params is read inside <Suspense> (instant-navigation validation); prebuilt
// slugs still resolve at build time — see roles/[slug]/page.tsx.
export default function CompanyPage({ params }: Props) {
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyProfile params={params} />
    </Suspense>
  )
}

function CompanySkeleton() {
  return (
    <main aria-busy="true" className="animate-pulse">
      <section className="border-b border-border bg-surface">
        <Container className="py-10 sm:py-14">
          <div className="h-4 w-16 rounded bg-surface-muted" />
          <div className="mt-3 h-9 w-1/2 rounded bg-surface-muted" />
          <div className="mt-4 h-4 w-2/3 rounded bg-surface-muted" />
        </Container>
      </section>
    </main>
  )
}

async function CompanyProfile({ params }: Props) {
  const { slug } = await params
  const profile = await loadCompany(slug)
  if (!profile) notFound()
  const { company, jobs } = profile

  return (
    <main>
      <section className="border-b border-border bg-surface">
        <Container className="py-10 sm:py-14">
          <p className="text-sm font-medium text-brand">Company</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {company.name}
          </h1>
          {company.description && (
            <p className="mt-4 max-w-2xl text-pretty text-fg-muted">
              {company.description}
            </p>
          )}
          {company.websiteUrl && (
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand-hover"
            >
              {company.websiteUrl.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </Container>
      </section>

      <Container className="space-y-4 py-10">
        <h2 className="text-lg font-semibold">
          Open roles{" "}
          <span className="font-normal text-fg-muted">({jobs.length})</span>
        </h2>
        {jobs.length > 0 ? (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.slug}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-dashed border-border-strong px-6 py-10 text-center text-fg-muted">
            {company.name} has no open roles right now.
          </p>
        )}
      </Container>
    </main>
  )
}
