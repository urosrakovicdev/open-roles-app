// Display labels for user Roles (CONTEXT.md: a Role is a permission level,
// never a Job). Pure data — safe on server and client. Mirrors the user_role
// enum in src/db/schema/auth.ts.

import type { UserRole } from "@/data/dto"

const ROLE_LABELS: Record<UserRole, string> = {
  candidate: "Candidate",
  employer: "Employer",
  admin: "Admin",
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

// For a Role <select> (the admin console).
export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map(
  (value) => ({ value, label: ROLE_LABELS[value] }),
)
