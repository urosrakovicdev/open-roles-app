// Admin moderation — reads & writes across ALL companies and users.
// server-only. Every function opens with requireFreshAdmin(), which checks the
// JWT's Role AND re-reads it from the database: a JWT keeps its Role until the
// next sign-in, and for site-wide powers that staleness matters
// (docs/03-architecture.md §5) — a demoted Admin loses access at once.
// Docs: https://nextjs.org/docs/app/guides/data-security

import "server-only"
import { count, desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db/drizzle"
import { applications, companies, jobs, users } from "@/db/schema"
import { requireRole, type Session } from "./dal"
import type { UserRole } from "./dto"
import { publicJobTags, type OwnerWriteResult } from "./jobs"

// How many rows the console lists. Plenty for this app; pagination would be
// the next step if it ever isn't.
const ADMIN_LIST_LIMIT = 200

export async function requireFreshAdmin(): Promise<Session> {
  const session = await requireRole("admin")
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)
  if (user?.role !== "admin") redirect("/dashboard")
  return session
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export type AdminJobDTO = {
  id: string
  slug: string
  title: string
  status: (typeof jobs.$inferSelect)["status"]
  companyName: string
  applicationCount: number
  updatedAt: Date
}

// ADMIN: every Job in every status, most recently changed first.
export async function listAllJobs(): Promise<AdminJobDTO[]> {
  await requireFreshAdmin()
  return db
    .select({
      id: jobs.id,
      slug: jobs.slug,
      title: jobs.title,
      status: jobs.status,
      companyName: companies.name,
      applicationCount: count(applications.id),
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .groupBy(jobs.id, companies.id)
    .orderBy(desc(jobs.updatedAt), desc(jobs.id))
    .limit(ADMIN_LIST_LIMIT)
}

async function findJob(jobId: string) {
  const [row] = await db
    .select({
      id: jobs.id,
      slug: jobs.slug,
      status: jobs.status,
      companySlug: companies.slug,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.id, jobId))
    .limit(1)
  return row ?? null
}

// ADMIN: close any Published Job (the same move its Employer can make).
export async function closeAnyJob(jobId: string): Promise<OwnerWriteResult> {
  await requireFreshAdmin()
  const job = await findJob(jobId)
  if (!job) return { ok: false, reason: "not_found" }
  if (job.status !== "published") return { ok: false, reason: "invalid_status" }

  await db.update(jobs).set({ status: "closed" }).where(eq(jobs.id, job.id))
  return { ok: true, tags: publicJobTags(job.slug, job.companySlug) }
}

// ADMIN: delete any Job (its Applications go with it — FK cascade).
export async function deleteAnyJob(jobId: string): Promise<OwnerWriteResult> {
  await requireFreshAdmin()
  const job = await findJob(jobId)
  if (!job) return { ok: false, reason: "not_found" }

  await db.delete(jobs).where(eq(jobs.id, job.id))
  return {
    ok: true,
    tags:
      job.status === "draft" ? [] : publicJobTags(job.slug, job.companySlug),
  }
}

// ── Users ──────────────────────────────────────────────────────────────────

// Admins see email addresses — moderation needs to tell accounts apart.
export type AdminUserDTO = {
  id: string
  name: string | null
  email: string
  role: UserRole
  createdAt: Date
  isMe: boolean
}

// ADMIN: every user, newest first. Never the password hash.
export async function listUsers(): Promise<AdminUserDTO[]> {
  const { userId } = await requireFreshAdmin()
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(ADMIN_LIST_LIMIT)
  return rows.map((row) => ({ ...row, isMe: row.id === userId }))
}

export type SetUserRoleResult =
  { ok: true } | { ok: false; reason: "not_found" | "own_role" }

// ADMIN: change another user's Role. Never your own — that's how the last
// Admin locks everyone out. The change reaches the user's session on their
// next sign-in (JWT); admin powers are re-checked live by requireFreshAdmin.
export async function setUserRole(
  targetUserId: string,
  role: UserRole,
): Promise<SetUserRoleResult> {
  const { userId } = await requireFreshAdmin()
  if (targetUserId === userId) return { ok: false, reason: "own_role" }

  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, targetUserId))
    .returning({ id: users.id })
  return updated ? { ok: true } : { ok: false, reason: "not_found" }
}
