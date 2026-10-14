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
import { makeSlug } from "@/lib/utils"
import type { JobInput } from "@/lib/validations/job"
import { companyTag, findOwnedCompany } from "./companies"
import { getOptionalSession, requireRole } from "./dal"
import {
  toJobCardDTO,
  toJobDetailDTO,
  toMyJobDTO,
  type JobCardDTO,
  type JobDetailDTO,
  type MyJobDTO,
} from "./dto"

export const JOBS_PAGE_SIZE = 10

// Cache tags for public Job data. `board` is the cached default Board view
// (roles/page.tsx); `job-${slug}` is one Job's detail read.
export const BOARD_TAG = "board"
export const jobTag = (slug: string) => `job-${slug}`

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
  cacheTag(jobTag(slug))

  const row = await db.query.jobs.findFirst({
    where: and(eq(jobs.slug, slug), inArray(jobs.status, PUBLIC_JOB_STATUSES)),
    with: { company: true },
  })
  if (!row) return null
  // The page shows company details too — refresh it when the company changes.
  cacheTag(companyTag(row.company.slug))
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

// ── OWNER reads & writes ───────────────────────────────────────────────────
// Every function opens with requireRole("employer") and reaches a Job only
// through the employer's company (company.ownerId = session.userId). An id
// that isn't yours behaves exactly like one that doesn't exist.
//
// Writes return the public cache tags they affect; the Server Action calls
// updateTag on them (updateTag is Server-Action-only).

export type OwnerWriteResult<Extra = object> =
  | ({ ok: true; tags: string[] } & Extra)
  | { ok: false; reason: "not_found" | "no_company" | "invalid_status" }

// Tags on a Public Job's data: its page, its company page, the Board.
export function publicJobTags(jobSlug: string, companySlug: string) {
  return [jobTag(jobSlug), companyTag(companySlug), BOARD_TAG]
}

// Internal: one of my Jobs + its company, or null.
async function findMyJob(userId: string, jobId: string) {
  const [row] = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.id, jobId), eq(companies.ownerId, userId)))
    .limit(1)
  return row ?? null
}

// A new Job slug: from the title, plus a random suffix so two "Frontend
// Engineer" Jobs never collide.
const newJobSlug = (title: string) =>
  makeSlug(title, { fallback: "role", suffix: true })

// Blank optional fields clear the column (undefined would skip it in UPDATE).
function jobValues(input: JobInput) {
  return {
    title: input.title,
    description: input.description,
    location: input.location ?? null,
    type: input.type,
    workMode: input.workMode,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
  }
}

// OWNER: all my Jobs, any status, most recently changed first.
export async function listMyJobs(): Promise<MyJobDTO[]> {
  const { userId } = await requireRole("employer")
  const rows = await db
    .select({ job: jobs })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(companies.ownerId, userId))
    .orderBy(desc(jobs.updatedAt), desc(jobs.id))
  return rows.map(({ job }) => toMyJobDTO(job))
}

// OWNER: one of my Jobs by id, or null (not found OR not mine — same answer).
export async function getMyJobById(jobId: string): Promise<MyJobDTO | null> {
  const { userId } = await requireRole("employer")
  const row = await findMyJob(userId, jobId)
  return row ? toMyJobDTO(row.job) : null
}

// OWNER, on a public page: the id of the Public Job at `slug` if the visitor
// is the Employer who owns it, else null. Never redirects (anyone may view
// the page) and never cached — it's per-visitor. Feeds the "Edit this role"
// link on /roles/[slug], kept out of the cached JobDetailDTO (ADR-0003).
export async function getMyJobIdBySlug(slug: string): Promise<string | null> {
  const session = await getOptionalSession()
  if (session?.role !== "employer") return null
  const [row] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.slug, slug), eq(companies.ownerId, session.userId)))
    .limit(1)
  return row?.id ?? null
}

// OWNER: a new Draft under my company. Drafts aren't public, so no tags.
export async function createJobForMyCompany(
  input: JobInput,
): Promise<OwnerWriteResult<{ jobId: string }>> {
  const { userId } = await requireRole("employer")
  const company = await findOwnedCompany(userId)
  if (!company) return { ok: false, reason: "no_company" }

  for (let attempt = 0; attempt < 3; attempt++) {
    const [created] = await db
      .insert(jobs)
      .values({
        ...jobValues(input),
        slug: newJobSlug(input.title),
        status: "draft",
        companyId: company.id,
      })
      .onConflictDoNothing({ target: jobs.slug })
      .returning({ id: jobs.id })
    if (created) return { ok: true, tags: [], jobId: created.id }
  }
  throw new Error("createJobForMyCompany: could not find a free slug")
}

// OWNER: edit one of my Jobs, in any status. The slug follows the title only
// while the Job has never been published; after that it's frozen so shared
// links keep working.
export async function updateMyJob(
  jobId: string,
  input: JobInput,
): Promise<OwnerWriteResult> {
  const { userId } = await requireRole("employer")
  const found = await findMyJob(userId, jobId)
  if (!found) return { ok: false, reason: "not_found" }
  const { job, company } = found

  const neverPublished = job.publishedAt === null
  const slug =
    neverPublished && input.title !== job.title
      ? newJobSlug(input.title)
      : job.slug

  await db
    .update(jobs)
    .set({ ...jobValues(input), slug })
    .where(and(eq(jobs.id, job.id), eq(jobs.companyId, company.id)))

  // A Draft edit touches nothing public.
  return {
    ok: true,
    tags: job.status === "draft" ? [] : publicJobTags(job.slug, company.slug),
  }
}

// The only lifecycle moves (CONTEXT.md): Draft → Published → Closed.
// Maps the target status to the status it must come from.
const TRANSITIONS = {
  published: "draft",
  closed: "published",
} as const

// OWNER: publish a Draft or close a Published Job. The current status is part
// of the WHERE, so a double submit or a stale button is a no-op, not a second
// transition.
export async function setMyJobStatus(
  jobId: string,
  status: keyof typeof TRANSITIONS,
): Promise<OwnerWriteResult> {
  const { userId } = await requireRole("employer")
  const found = await findMyJob(userId, jobId)
  if (!found) return { ok: false, reason: "not_found" }
  const { job, company } = found

  const [updated] = await db
    .update(jobs)
    .set({
      status,
      // Publishing stamps the date the Board sorts by.
      ...(status === "published" && { publishedAt: new Date() }),
    })
    .where(
      and(
        eq(jobs.id, job.id),
        eq(jobs.companyId, company.id),
        eq(jobs.status, TRANSITIONS[status]),
      ),
    )
    .returning({ id: jobs.id })
  if (!updated) return { ok: false, reason: "invalid_status" }

  // Publishing also clears any cached "not found" for this slug.
  return { ok: true, tags: publicJobTags(job.slug, company.slug) }
}

// OWNER: delete one of my Jobs (its Applications go with it — FK cascade).
export async function deleteMyJob(jobId: string): Promise<OwnerWriteResult> {
  const { userId } = await requireRole("employer")
  const found = await findMyJob(userId, jobId)
  if (!found) return { ok: false, reason: "not_found" }
  const { job, company } = found

  await db
    .delete(jobs)
    .where(and(eq(jobs.id, job.id), eq(jobs.companyId, company.id)))

  return {
    ok: true,
    tags: job.status === "draft" ? [] : publicJobTags(job.slug, company.slug),
  }
}
