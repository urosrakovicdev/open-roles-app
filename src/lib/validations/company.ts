// Zod schema for the employer's Company form. Shape only — WHICH company gets
// written is decided by the DAL from the session (the owner), never by input.
// Docs: https://zod.dev/api

import { z } from "zod"
import { optionalHttpUrl, optionalText } from "./fields"

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your company’s name.")
    .max(100, "Keep the name under 100 characters."),
  description: optionalText(
    2000,
    "Keep the description under 2,000 characters.",
  ),
  websiteUrl: optionalHttpUrl(),
  logoUrl: optionalHttpUrl(),
})

export type CompanyInput = z.infer<typeof companySchema>
