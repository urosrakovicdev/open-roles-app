// Application MUTATIONS — Server Actions. Each is a public POST endpoint:
// verify → authorize → validate (zod) → write (DAL) → refresh. Thin: the DAL
// takes the Candidate id from the session (never from the form) and scopes
// every Employer write to Jobs their company owns.
// Docs: https://nextjs.org/docs/app/guides/server-actions
//       https://nextjs.org/docs/app/api-reference/functions/refresh

"use server"

import { refresh } from "next/cache"
import { z } from "zod"
import { applyToJob } from "@/data/applications"
import { requireRole } from "@/data/dal"
import { applySchema } from "@/lib/validations/application"

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
