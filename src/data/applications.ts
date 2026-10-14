// Application reads & writes. server-only. The strictest ownership rules in
// the app: a Candidate sees only their own Applications; an Employer only
// those to Jobs their company owns. Every query is scoped by the session —
// never by an id from the request.
// Docs: https://nextjs.org/docs/app/guides/data-security
//       https://orm.drizzle.team/docs/insert#on-conflict-do-nothing

import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/db/drizzle"
import { applications, companies, jobs } from "@/db/schema"
import type { ApplyInput } from "@/lib/validations/application"
import { getOptionalSession, requireRole, verifySession } from "./dal"
import type { MyApplicationDTO } from "./dto"

// ── CANDIDATE ──────────────────────────────────────────────────────────────

export type ApplyResult =
  { ok: true } | { ok: false; reason: "not_accepting" | "already_applied" }

// CANDIDATE: apply to a Published Job. The Candidate is the session user;
// the unique (job_id, candidate_id) index is the real "once per Job" check,
// so a double submit can't create two.
export async function applyToJob(input: ApplyInput): Promise<ApplyResult> {
  const { userId } = await requireRole("candidate")

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.slug, input.jobSlug), eq(jobs.status, "published")))
    .limit(1)
  // Unknown, Draft and Closed Jobs all answer the same way.
  if (!job) return { ok: false, reason: "not_accepting" }

  const [created] = await db
    .insert(applications)
    .values({
      jobId: job.id,
      candidateId: userId,
      coverLetter: input.coverLetter ?? null,
      resumeUrl: input.resumeUrl ?? null,
    })
    .onConflictDoNothing({
      target: [applications.jobId, applications.candidateId],
    })
    .returning({ id: applications.id })
  if (!created) return { ok: false, reason: "already_applied" }
  return { ok: true }
}

// CANDIDATE, on a public page: has the visitor already applied to this Job?
// Never redirects (anyone may view the page) and never cached — it's
// per-visitor. False for anyone who isn't a signed-in Candidate.
export async function hasApplied(jobSlug: string): Promise<boolean> {
  const session = await getOptionalSession()
  if (session?.role !== "candidate") return false
  const [row] = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(eq(jobs.slug, jobSlug), eq(applications.candidateId, session.userId)),
    )
    .limit(1)
  return Boolean(row)
}

// CANDIDATE: my Applications, newest first.
export async function listMyApplications(): Promise<MyApplicationDTO[]> {
  const { userId } = await requireRole("candidate")
  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.createdAt,
      jobSlug: jobs.slug,
      jobTitle: jobs.title,
      jobStatus: jobs.status,
      companyName: companies.name,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(applications.candidateId, userId))
    .orderBy(desc(applications.createdAt), desc(applications.id))
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    appliedAt: row.appliedAt,
    job: {
      slug: row.jobSlug,
      title: row.jobTitle,
      companyName: row.companyName,
      isAcceptingApplications: row.jobStatus === "published",
    },
  }))
}

// ── EMPLOYER ───────────────────────────────────────────────────────────────

// Employer view: applications to MY company's roles.
export async function listApplicationsForMyJobs() {
  const { userId } = await verifySession()
  // TODO (M5, chunk 2): join job→company, where company.ownerId === userId.
  void userId
  return []
}
