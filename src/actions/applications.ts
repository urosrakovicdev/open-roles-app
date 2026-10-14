// Application MUTATIONS — Server Actions. Each is a public POST endpoint:
// verify → authorize → validate (zod) → write (DAL) → refresh. Thin: the DAL
// takes the Candidate id from the session (never from the form) and scopes
// every Employer write to Jobs their company owns.
// Docs: https://nextjs.org/docs/app/guides/server-actions
//       https://nextjs.org/docs/app/api-reference/functions/refresh

"use server"

import { refresh } from "next/cache"
import { z } from "zod"
import { applyToJob, setApplicationStatus } from "@/data/applications"
import { requireRole } from "@/data/dal"
import {
  applicationIdSchema,
  applicationStatusSchema,
  applySchema,
} from "@/lib/validations/application"

export type ApplyFormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
  fields?: { coverLetter?: string; resumeUrl?: string }
} | null

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

// A Candidate applies to a Published Job. On success the page re-renders and
// the Apply panel shows "Applied" instead of the form.
export async function applyAction(
  _prev: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  await requireRole("candidate")
  const fields = {
    coverLetter: text(formData, "coverLetter"),
    resumeUrl: text(formData, "resumeUrl"),
  }
  const parsed = applySchema.safeParse({
    ...fields,
    jobSlug: text(formData, "jobSlug"),
  })
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }

  const result = await applyToJob(parsed.data)
  if (!result.ok) {
    if (result.reason === "already_applied") {
      refresh()
      return { message: "You’ve already applied to this role." }
    }
    return {
      message: "This role is no longer accepting applications.",
      fields,
    }
  }
  refresh()
  return { ok: true }
}

// An Employer moves an Application to a new status. A plain form action bound
// to the Application id (untrusted, like any field): the DAL only updates it
// if the Job belongs to the Employer's company. Invalid input or someone
// else's id is a no-op; refresh() re-renders the real state either way.
export async function setApplicationStatusAction(
  applicationId: string,
  formData: FormData,
) {
  await requireRole("employer")
  const id = applicationIdSchema.safeParse(applicationId)
  const status = applicationStatusSchema.safeParse(formData.get("status"))
  if (id.success && status.success) {
    await setApplicationStatus(id.data, status.data)
  }
  refresh()
}
