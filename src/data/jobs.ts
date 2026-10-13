// Job reads & writes. server-only. Returns DTOs — shaped objects with only the
// fields the UI may see — never raw Drizzle rows.
//
// Two audiences, two trust levels, deliberately separate functions:
//  - PUBLIC reads take plain args and never a session. The Board lists
//    Published only; the detail page serves Published OR Closed (ADR-0005).
//    Bounded-arg reads are 'use cache' + cacheTag here (ADR-0003).
//  - OWNER reads/writes open with requireRole("employer") and scope by
//    company.ownerId = session.userId, or you ship an IDOR.
//
// Docs: https://orm.drizzle.team/docs/select
//       https://nextjs.org/docs/app/api-reference/directives/use-cache
//       https://nextjs.org/docs/app/guides/data-security

import "server-only"
import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"
import { db } from "@/db/drizzle"
import { companies, jobs } from "@/db/schema"
import { verifySession } from "./dal"
import {
  toJobCardDTO,
  toJobDetailDTO,
  type JobCardDTO,
  type JobDetailDTO,
} from "./dto"

export const JOBS_PAGE_SIZE = 10

// A Public Job is reachable at /roles/[slug]: Published OR Closed (ADR-0005).
// Deliberately NOT the Board's predicate — see listPublishedJobs.
const PUBLIC_JOB_STATUSES = ["published", "closed"] as const

// Escape LIKE wildcards so a search for "100%" or "c_o" is literal.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

// PUBLIC: the Board. Published only. Uncached — q is unbounded free text
// (ADR-0003); the parameterless default view is cached one level up.
export async function listPublishedJobs({
  q,
  type,
  workMode,
  page = 1,
}: {
  q?: string
  type?: JobCardDTO["type"]
  workMode?: JobCardDTO["workMode"]
  page?: number
}): Promise<{
  items: JobCardDTO[]
  page: number
  totalPages: number
  total: number
}> {
  const conditions: SQL[] = [eq(jobs.status, "published")]
  if (type) conditions.push(eq(jobs.type, type))
  if (workMode) conditions.push(eq(jobs.workMode, workMode))
  const needle = q?.trim().slice(0, 100)
  if (needle) {
    const pattern = `%${escapeLike(needle)}%`
    conditions.push(
      or(
        ilike(jobs.title, pattern),
        ilike(companies.name, pattern),
        ilike(jobs.location, pattern),
      )!,
    )
  }
  const where = and(...conditions)

  const pageQuery = (n: number) =>
    db
      .select({ job: jobs, company: companies })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(where)
      .orderBy(desc(jobs.publishedAt), desc(jobs.id))
      .limit(JOBS_PAGE_SIZE)
      .offset((n - 1) * JOBS_PAGE_SIZE)

  const requested = Math.max(1, Math.floor(page))
  // One round-trip for the count and the page.
  const [[{ total }], firstTry] = await db.batch([
    db
      .select({ total: count() })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(where),
    pageQuery(requested),
  ])
  const totalPages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE))
  // Past the end (stale link, hand-edited URL): serve the last page instead.
  const current = Math.min(requested, totalPages)
  const rows = current === requested ? firstTry : await pageQuery(current)

  return {
    items: rows.map(({ job, company }) => toJobCardDTO({ ...job, company })),
    page: current,
    totalPages,
    total,
  }
}

// PUBLIC: one Public Job (Published or Closed) by slug. Cached + tagged; the
// page and generateMetadata share this one entry. Returns null for unknown
// slugs and Drafts — the page renders soft-404 UI (ADR-0004).
export async function getPublicJobBySlug(
  slug: string,
): Promise<JobDetailDTO | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(`job-${slug}`)

  const row = await db.query.jobs.findFirst({
    where: and(eq(jobs.slug, slug), inArray(jobs.status, PUBLIC_JOB_STATUSES)),
    with: { company: true },
  })
  if (!row) return null
  // The page shows company details too — refresh it when the company changes.
  cacheTag(`company-${row.company.slug}`)
  return toJobDetailDTO(row)
}

// PUBLIC: every Public Job slug, for generateStaticParams. Build-time only.
export async function listPublicJobSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: jobs.slug })
    .from(jobs)
    .where(inArray(jobs.status, PUBLIC_JOB_STATUSES))
  return rows.map((row) => row.slug)
}

// OWNER: Jobs belonging to the signed-in employer's company (drafts included).
export async function listMyJobs() {
  const { userId } = await verifySession() // M3: switch to requireRole("employer")
  // TODO (M4): scope by company.ownerId === userId. Map to DTOs.
  void userId
  return []
}

// TODO (M4): getMyJobById, createJobForMyCompany, updateMyJob, setMyJobStatus,
// deleteMyJob — all owner-scoped. See docs/04-roadmap.md.
