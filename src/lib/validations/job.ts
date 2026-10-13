// Zod schemas for job input. Validation checks the SHAPE of data — it does NOT
// check ownership (that's the DAL's job; conflating them is a classic
// trap). Shared by the Server Action (server-side) and optionally the form.
// Docs: https://zod.dev  ·  https://nextjs.org/docs/app/guides/forms

import { z } from "zod"

export const createJobSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20),
  location: z.string().max(120).optional(),
  type: z.enum(["full_time", "part_time", "contract", "internship"]),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
