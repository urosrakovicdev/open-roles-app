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
import { db } from "@/db/drizzle"
import { verifySession } from "./dal"
import type { JobCardDTO, JobDetailDTO } from "./dto"

// PUBLIC: the Board. Published only. Uncached — q is unbounded free text.
export async function listPublishedJobs(_params: {
  q?: string
  type?: string
  workMode?: string
  page?: number
}): Promise<{ items: JobCardDTO[]; page: number; totalPages: number }> {
  // TODO (M2): filter status = 'published', ILIKE search, paginate, map to DTOs.
  void db
  return { items: [], page: 1, totalPages: 1 }
}

// PUBLIC: one Public Job (Published or Closed) by slug. Cached + tagged.
export async function getPublicJobBySlug(
  _slug: string,
): Promise<JobDetailDTO | null> {
  // TODO (M2): 'use cache'; cacheTag(`job-${slug}`); cacheLife(...);
  // query job + company where status in ('published','closed'); null if none.
  return null
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
