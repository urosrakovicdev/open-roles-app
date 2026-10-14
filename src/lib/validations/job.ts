// Zod schema for the Job form (new + edit). Validation checks the SHAPE of
// data — it does NOT check ownership (that's the DAL's job; conflating them
// is a classic trap). Blank optional fields arrive as "" and become undefined.
// Docs: https://zod.dev/api  ·  https://nextjs.org/docs/app/guides/forms

import { z } from "zod"
import { optionalText } from "./fields"

// Mirror the employment_type / work_mode DB enums (src/db/schema/jobs.ts);
// the DAL's insert types fail to compile if they drift.
const EMPLOYMENT_TYPE_VALUES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const
const WORK_MODE_VALUES = ["remote", "hybrid", "onsite"] as const

const MAX_SALARY = 10_000_000

// Optional whole number; blank → undefined. Annual USD, like the seed.
const salary = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value.trim() === ""
        ? undefined
        : value.replace(/[,\s]/g, "") // "120,000" is fine
      : value,
  z.coerce
    .number("Enter a number.")
    .int("Use a whole number.")
    .min(0, "Salary can’t be negative.")
    .max(MAX_SALARY, "That salary looks too high.")
    .optional(),
)

export const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters.")
      .max(120, "Keep the title under 120 characters."),
    description: z
      .string()
      .trim()
      .min(20, "Describe the role in at least 20 characters.")
      .max(10_000, "Keep the description under 10,000 characters."),
    location: optionalText(120, "Keep the location under 120 characters."),
    type: z.enum(EMPLOYMENT_TYPE_VALUES, "Choose an employment type."),
    workMode: z.enum(WORK_MODE_VALUES, "Choose a work mode."),
    salaryMin: salary,
    salaryMax: salary,
  })
  .refine(
    ({ salaryMin, salaryMax }) =>
      salaryMin === undefined ||
      salaryMax === undefined ||
      salaryMin <= salaryMax,
    {
      message: "The maximum can’t be lower than the minimum.",
      path: ["salaryMax"],
    },
  )

export type JobInput = z.infer<typeof jobSchema>

// The form field names, in order — the action reads exactly these.
export const JOB_FIELDS = [
  "title",
  "description",
  "location",
  "type",
  "workMode",
  "salaryMin",
  "salaryMax",
] as const

// A Job id from a bound action argument: untrusted, so shape-check it. The
// DAL's owner-scoped query is what decides whether it's yours.
export const jobIdSchema = z.string().min(1).max(100)
