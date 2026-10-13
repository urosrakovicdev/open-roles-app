// Zod schema for applying to a role. Shape only — the candidate id comes from
// the session in the Server Action, never from here.
// Docs: https://zod.dev

import { z } from "zod"

export const applySchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().max(5000).optional(),
  resumeUrl: z.string().url().optional(),
})

export type ApplyInput = z.infer<typeof applySchema>
