// DTOs (Data Transfer Objects) + their mappers.
// A DTO is the shaped, minimal object the UI receives — only safe fields, plus
// derived flags (e.g. isAcceptingApplications). Mappers convert a raw DB row →
// DTO. Keeping these here means "what may the client see?" is answered in ONE
// place. Never include passwordHash or another user's data.
//
// Mappers are plain functions (no "server-only" import), but they're only
// called inside src/data/ — the UI imports the TYPES, never rows.
//
// Docs: https://nextjs.org/docs/app/guides/data-security (Controlling return values)

import type { companies, jobs, users } from "@/db/schema"

type JobRow = typeof jobs.$inferSelect
type CompanyRow = typeof companies.$inferSelect

// ── User ───────────────────────────────────────────────────────────────────

// A user's permission level (CONTEXT.md: a Role is never a Job).
export type UserRole = (typeof users.$inferSelect)["role"]

// ── Company ────────────────────────────────────────────────────────────────

export type CompanyDTO = {
  slug: string
  name: string
  description: string | null
  websiteUrl: string | null
  logoUrl: string | null
}

// No ownerId: who owns a company is an authorization fact, not display data.
export function toCompanyDTO(row: CompanyRow): CompanyDTO {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    websiteUrl: row.websiteUrl,
    logoUrl: row.logoUrl,
  }
}

// ── Job ────────────────────────────────────────────────────────────────────

export type JobCardDTO = {
  slug: string
  title: string
  companyName: string
  companySlug: string
  location: string | null
  workMode: JobRow["workMode"]
  type: JobRow["type"]
  salaryMin: number | null
  salaryMax: number | null
  publishedAt: Date | null
}

// NO `canEdit` here: the detail read is cached and session-free (ADR-0003).
// Ownership affordances come from a separate, dynamic owner-scoped read.
export type JobDetailDTO = JobCardDTO & {
  description: string
  status: "published" | "closed" // a Public Job is never a Draft (ADR-0005)
  isAcceptingApplications: boolean // status === 'published'
  // When a Closed Job stopped accepting applications (JSON-LD validThrough).
  // There's no closed_at column: closing is the Job's last update.
  closedAt: Date | null
  updatedAt: Date
  company: CompanyDTO
}

type JobWithCompany = JobRow & { company: CompanyRow }

export function toJobCardDTO(row: JobWithCompany): JobCardDTO {
  return {
    slug: row.slug,
    title: row.title,
    companyName: row.company.name,
    companySlug: row.company.slug,
    location: row.location,
    workMode: row.workMode,
    type: row.type,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    publishedAt: row.publishedAt,
  }
}

// Only for Public Jobs — callers filter out Drafts in the query; this throws
// if one slips through rather than rendering it.
export function toJobDetailDTO(row: JobWithCompany): JobDetailDTO {
  if (row.status === "draft") {
    throw new Error(`toJobDetailDTO: Job ${row.id} is a Draft`)
  }
  return {
    ...toJobCardDTO(row),
    description: row.description,
    status: row.status,
    isAcceptingApplications: row.status === "published",
    closedAt: row.status === "closed" ? row.updatedAt : null,
    updatedAt: row.updatedAt,
    company: toCompanyDTO(row.company),
  }
}
