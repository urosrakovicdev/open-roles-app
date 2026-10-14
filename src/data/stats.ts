// Dashboard counts. server-only. One function, three Role-specific answers —
// each scoped exactly like the pages the numbers link to: a Candidate counts
// their own Applications, an Employer their own company's Jobs and the
// Applications to them, an Admin the whole site. Uncached (per-user).
// Docs: https://orm.drizzle.team/docs/select#aggregations

import "server-only"
import { count, eq, sql } from "drizzle-orm"
import { db } from "@/db/drizzle"
import { applications, companies, jobs, users } from "@/db/schema"
import { verifySession } from "./dal"

export type StatDTO = { label: string; value: number; href: string }

// count(*) FILTER (WHERE …) — several counts from one scan.
const countWhere = (condition: ReturnType<typeof sql>) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number)

export async function getDashboardStats(): Promise<StatDTO[]> {
  const { userId, role } = await verifySession()

  if (role === "candidate") {
    const [row] = await db
      .select({
        total: count(),
        reviewing: countWhere(sql`${applications.status} = 'reviewing'`),
        accepted: countWhere(sql`${applications.status} = 'accepted'`),
      })
      .from(applications)
      .where(eq(applications.candidateId, userId))
    const href = "/dashboard/applications"
    return [
      { label: "Applications", value: row.total, href },
      { label: "In review", value: row.reviewing, href },
      { label: "Accepted", value: row.accepted, href },
    ]
  }

  if (role === "employer") {
    const [[jobCounts], [applicationCounts]] = await db.batch([
      db
        .select({
          published: countWhere(sql`${jobs.status} = 'published'`),
          drafts: countWhere(sql`${jobs.status} = 'draft'`),
        })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(companies.ownerId, userId)),
      db
        .select({
          total: count(),
          fresh: countWhere(sql`${applications.status} = 'submitted'`),
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(companies.ownerId, userId)),
    ])
    return [
      {
        label: "Published roles",
        value: jobCounts.published,
        href: "/dashboard/roles",
      },
      { label: "Drafts", value: jobCounts.drafts, href: "/dashboard/roles" },
      {
        label: "Applications",
        value: applicationCounts.total,
        href: "/dashboard/applications",
      },
      {
        label: "Not yet reviewed",
        value: applicationCounts.fresh,
        href: "/dashboard/applications",
      },
    ]
  }

  // Admin: site-wide.
  const [[userCount], [jobCount], [applicationCount]] = await db.batch([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.status, "published")),
    db.select({ value: count() }).from(applications),
  ])
  return [
    { label: "Users", value: userCount.value, href: "/admin#users" },
    { label: "Published roles", value: jobCount.value, href: "/admin#jobs" },
    { label: "Applications", value: applicationCount.value, href: "/admin" },
  ]
}
