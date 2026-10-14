// Company reads & writes. server-only. Returns DTOs, never raw rows.
//
// Two audiences, deliberately separate functions (ADR-0003):
//  - PUBLIC: the company profile page — cached, session-free.
//  - OWNER: the employer's own Company for /dashboard/company — open with
//    requireRole("employer") and scope by company.ownerId = session.userId.
//
// Docs: https://orm.drizzle.team/docs/rqb
//       https://nextjs.org/docs/app/api-reference/directives/use-cache

import "server-only"
import { asc, eq } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"
import { db } from "@/db/drizzle"
import { companies } from "@/db/schema"
import type { CompanyInput } from "@/lib/validations/company"
import { makeSlug } from "@/lib/utils"
import { requireRole } from "./dal"
import {
  toCompanyDTO,
  toJobCardDTO,
  type CompanyDTO,
  type JobCardDTO,
} from "./dto"

// The cache tag on a company's public data. Job pages carry it too (they
// show the company card), and Board cards show the company name.
export const companyTag = (slug: string) => `company-${slug}`

export type PublicCompanyProfile = {
  company: CompanyDTO
  jobs: JobCardDTO[] // Published only — the company's open roles
}

// PUBLIC: a company and its Published Jobs, by slug. Cached + tagged
// `company-${slug}`; Job and Company writes updateTag it.
export async function getPublicCompanyBySlug(
  slug: string,
): Promise<PublicCompanyProfile | null> {
  "use cache"
  cacheLife("hours")
  cacheTag(companyTag(slug))

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

// The signed-in employer's Company row. The schema allows several per owner;
// the UI manages one — the oldest. Internal: callers get a DTO or an id.
export async function findOwnedCompany(userId: string) {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.ownerId, userId))
    .orderBy(asc(companies.createdAt))
    .limit(1)
  return row ?? null
}

// OWNER: my Company, or null if I haven't created one yet.
export async function getMyCompany(): Promise<CompanyDTO | null> {
  const { userId } = await requireRole("employer")
  const row = await findOwnedCompany(userId)
  return row ? toCompanyDTO(row) : null
}

export type UpsertCompanyResult = { slug: string; created: boolean }

// OWNER: create my Company, or update it. The owner is always the session
// user. The slug is set once, from the name at creation, and never changes —
// renaming a company doesn't break its public URL.
export async function upsertMyCompany(
  input: CompanyInput,
): Promise<UpsertCompanyResult> {
  const { userId } = await requireRole("employer")
  // Blank optional fields clear the column (undefined would skip it).
  const values = {
    name: input.name,
    description: input.description ?? null,
    websiteUrl: input.websiteUrl ?? null,
    logoUrl: input.logoUrl ?? null,
  }

  const existing = await findOwnedCompany(userId)
  if (existing) {
    await db.update(companies).set(values).where(eq(companies.id, existing.id))
    return { slug: existing.slug, created: false }
  }

  // Prefer the bare name as the slug; if a company already has it, add a
  // random suffix. The unique index is the real check (no read-then-write race).
  for (const suffix of [false, true, true]) {
    const slug = makeSlug(input.name, { fallback: "company", suffix })
    const [created] = await db
      .insert(companies)
      .values({ ...values, slug, ownerId: userId })
      .onConflictDoNothing({ target: companies.slug })
      .returning({ slug: companies.slug })
    if (created) return { slug: created.slug, created: true }
  }
  throw new Error("upsertMyCompany: could not find a free slug")
}
