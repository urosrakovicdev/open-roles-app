// Zod schemas for Applications. Shape only — the Candidate id comes from the
// session in the DAL, never from here, and whether the Job is accepting
// Applications is the DAL's call too.
// Docs: https://zod.dev/api

import { z } from "zod"
import { optionalHttpUrl, optionalText } from "./fields"

export const applySchema = z.object({
  // The Job's public slug (the cached detail DTO carries no id).
  jobSlug: z.string().min(1).max(120),
  coverLetter: optionalText(
    5000,
    "Keep your cover letter under 5,000 characters.",
  ),
  resumeUrl: optionalHttpUrl(
    "Enter a full link to your résumé, like https://example.com/cv.pdf.",
  ),
})

export type ApplyInput = z.infer<typeof applySchema>

// Mirrors the application_status DB enum (src/db/schema/applications.ts).
export const APPLICATION_STATUS_VALUES = [
  "submitted",
  "reviewing",
  "accepted",
  "rejected",
] as const

export const applicationStatusSchema = z.enum(
  APPLICATION_STATUS_VALUES,
  "Choose a status.",
)

// An Application id from a bound action argument — untrusted.
export const applicationIdSchema = z.string().min(1).max(100)
