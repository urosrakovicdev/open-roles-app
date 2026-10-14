// Admin MUTATIONS — Server Actions. Public POST endpoints like any other:
// verify → authorize → validate (zod) → write (DAL) → revalidate. Each DAL
// call re-checks the Admin Role against the database (requireFreshAdmin), so
// a stale JWT can't moderate. Bound ids are untrusted input, shape-checked
// here. Plain form actions: a stale click is a no-op and refresh() shows the
// real state.
// Docs: https://nextjs.org/docs/app/guides/server-actions
//       https://nextjs.org/docs/app/api-reference/functions/updateTag

"use server"

import { refresh, updateTag } from "next/cache"
import { z } from "zod"
import { closeAnyJob, deleteAnyJob, setUserRole } from "@/data/admin"
import { requireRole } from "@/data/dal"
import type { OwnerWriteResult } from "@/data/jobs"
import { jobIdSchema } from "@/lib/validations/job"

const userIdSchema = z.string().min(1).max(100)
const roleSchema = z.enum(["candidate", "employer", "admin"])

function expire(result: OwnerWriteResult) {
  if (result.ok) result.tags.forEach((tag) => updateTag(tag))
}

export async function adminCloseJob(jobId: string) {
  await requireRole("admin")
  const id = jobIdSchema.safeParse(jobId)
  if (id.success) expire(await closeAnyJob(id.data))
  refresh()
}

export async function adminDeleteJob(jobId: string) {
  await requireRole("admin")
  const id = jobIdSchema.safeParse(jobId)
  if (id.success) expire(await deleteAnyJob(id.data))
  refresh()
}

export async function adminSetUserRole(userId: string, formData: FormData) {
  await requireRole("admin")
  const id = userIdSchema.safeParse(userId)
  const role = roleSchema.safeParse(formData.get("role"))
  if (id.success && role.success) await setUserRole(id.data, role.data)
  refresh()
}
