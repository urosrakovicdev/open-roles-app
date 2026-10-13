// DTOs (Data Transfer Objects) + their mappers.
// A DTO is the shaped, minimal object the UI receives — only safe fields, plus
// derived flags (e.g. isAcceptingApplications). Mappers convert a raw DB row →
// DTO. Keeping these here means "what may the client see?" is answered in ONE
// place. Never include passwordHash or another user's data.
//
// Docs: https://nextjs.org/docs/app/guides/data-security (Controlling return values)

// Starting shapes (TODO M2: finalize against the schema + add CompanyDTO,
// application DTOs in M5).
export type JobCardDTO = {
  slug: string
  title: string
  companyName: string
  companySlug: string
  location: string | null
  workMode: "remote" | "hybrid" | "onsite" | null
  type: "full_time" | "part_time" | "contract" | "internship"
  salaryMin: number | null
  salaryMax: number | null
  publishedAt: Date | null
}

// NO `canEdit` here: the detail read is cached and session-free (ADR-0003).
// Ownership affordances come from a separate, dynamic owner-scoped read.
export type JobDetailDTO = JobCardDTO & {
  description: string
  isAcceptingApplications: boolean // status === 'published'
}

// TODO (M2): export toJobCardDTO(row) / toJobDetailDTO(row) / toCompanyDTO(row).
