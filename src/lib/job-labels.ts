// Display labels for Job enums, plus the option lists the filters and forms
// use. Pure data — safe on server and client. The values mirror the DB enums
// (employment_type, work_mode); keep them in sync with src/db/schema/jobs.ts.

import type { JobCardDTO } from "@/data/dto"

export type EmploymentType = JobCardDTO["type"]
export type WorkMode = NonNullable<JobCardDTO["workMode"]>

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
]

export const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
]

export function employmentTypeLabel(type: EmploymentType): string {
  return EMPLOYMENT_TYPES.find((t) => t.value === type)?.label ?? type
}

export function workModeLabel(mode: WorkMode): string {
  return WORK_MODES.find((m) => m.value === mode)?.label ?? mode
}

// Narrow untrusted input (a URL param) to a known value, or undefined.
export function parseEmploymentType(
  value?: string,
): EmploymentType | undefined {
  return EMPLOYMENT_TYPES.find((t) => t.value === value)?.value
}

export function parseWorkMode(value?: string): WorkMode | undefined {
  return WORK_MODES.find((m) => m.value === value)?.value
}
