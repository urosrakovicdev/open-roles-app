// Job MUTATIONS — Server Actions. 'use server' makes every function here a
// PUBLIC POST endpoint, so each one: verify → authorize → validate (zod) →
// write (DAL) → revalidate. Kept thin: the DAL re-checks the Role, scopes the
// Job to the employer's company (no IDOR) and says which public cache tags
// the write touched; the action expires them with updateTag so the employer
// sees their own write on the very next request.
//
// Bound Job ids (publishJob.bind(null, id)) are client-supplied like any
// form field — shape-checked here, ownership-checked in the DAL.
//
// Docs: https://nextjs.org/docs/app/guides/server-actions
//       https://nextjs.org/docs/app/api-reference/functions/updateTag
//       https://nextjs.org/docs/app/api-reference/functions/refresh

"use server"

import { refresh, updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireRole } from "@/data/dal"
import {
  createJobForMyCompany,
  deleteMyJob,
  setMyJobStatus,
  updateMyJob,
  type OwnerWriteResult,
} from "@/data/jobs"
import { JOB_FIELDS, jobIdSchema, jobSchema } from "@/lib/validations/job"

export type JobFormState = {
  message?: string
  errors?: Record<string, string[] | undefined>
  fields?: Record<string, string>
} | null

// The submitted fields as strings, echoed back on error so the form keeps
// what was typed.
function readJobFields(formData: FormData) {
  return Object.fromEntries(
    JOB_FIELDS.map((key) => {
      const value = formData.get(key)
      return [key, typeof value === "string" ? value : ""]
    }),
  )
}

function expire(result: OwnerWriteResult) {
  if (result.ok) result.tags.forEach((tag) => updateTag(tag))
}

export async function createJob(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireRole("employer")
  const fields = readJobFields(formData)
  const parsed = jobSchema.safeParse(fields)
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }

  const result = await createJobForMyCompany(parsed.data)
  if (!result.ok) redirect("/dashboard/company?from=new-role")
  expire(result)
  redirect("/dashboard/roles")
}

export async function updateJob(
  jobId: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireRole("employer")
  const id = jobIdSchema.safeParse(jobId)
  const fields = readJobFields(formData)
  const parsed = jobSchema.safeParse(fields)
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }

  const result = id.success
    ? await updateMyJob(id.data, parsed.data)
    : ({ ok: false, reason: "not_found" } as const)
  if (!result.ok) {
    return { message: "This role no longer exists.", fields }
  }
  expire(result)
  redirect("/dashboard/roles")
}

// The row actions on /dashboard/roles. Plain form actions: a stale or
// repeated click (already published, already deleted) is a harmless no-op,
// and refresh() re-renders the list either way.

export async function publishJob(jobId: string) {
  await requireRole("employer")
  const id = jobIdSchema.safeParse(jobId)
  if (id.success) expire(await setMyJobStatus(id.data, "published"))
  refresh()
}

export async function closeJob(jobId: string) {
  await requireRole("employer")
  const id = jobIdSchema.safeParse(jobId)
  if (id.success) expire(await setMyJobStatus(id.data, "closed"))
  refresh()
}

export async function deleteJob(jobId: string) {
  await requireRole("employer")
  const id = jobIdSchema.safeParse(jobId)
  if (id.success) expire(await deleteMyJob(id.data))
  refresh()
}
