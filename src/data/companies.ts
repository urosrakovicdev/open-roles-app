// Company reads. server-only. Returns DTOs, never raw rows.
//
// PUBLIC reads only for now (the company profile page). Owner reads/writes —
// upsertMyCompany for /dashboard/company — arrive in M4, as separate functions
// that open with requireRole("employer"), never as flags on these.
//
// Docs: https://orm.drizzle.team/docs/rqb
//       https://nextjs.org/docs/app/api-reference/directives/use-cache

import "server-only"
import { eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"
import { db } from "@/db/drizzle"
import { companies } from "@/db/schema"
import {
  toCompanyDTO,
  toJobCardDTO,
  type CompanyDTO,
  type JobCardDTO,
} from "./dto"

export type PublicCompanyProfile = {
  company: CompanyDTO
  jobs: JobCardDTO[] // Published only — the company's open roles
}

// PUBLIC: a company and its Published Jobs, by slug. Cached + tagged
// `company-${slug}`; publishing/closing a Job must updateTag it (M4).
export async function getPublicCompanyBySlug(
  slug: string,
): Promise<PublicCompanyProfile | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(`company-${slug}`)

  const row = await db.query.companies.findFirst({
    where: eq(companies.slug, slug),
    with: {
      jobs: {
        where: (jobs, { eq }) => eq(jobs.status, "published"),
        orderBy: (jobs, { desc }) => [desc(jobs.publishedAt)],
      },
    },
  })
  if (!row) return null
  const { jobs, ...company } = row
  return {
    company: toCompanyDTO(company),
    jobs: jobs.map((job) => toJobCardDTO({ ...job, company })),
  }
}

// PUBLIC: every company slug, for generateStaticParams. Build-time only.
export async function listPublicCompanySlugs(): Promise<string[]> {
  const rows = await db.select({ slug: companies.slug }).from(companies)
  return rows.map((row) => row.slug)
}
