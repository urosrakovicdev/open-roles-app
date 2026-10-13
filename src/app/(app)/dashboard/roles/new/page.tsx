// "Post a role" ("/dashboard/roles/new" → grouped under (app)). Employer-only.
// The page guards with requireRole('employer'); the form posts to createJob.
// Docs: https://nextjs.org/docs/app/guides/forms

import { requireRole } from "@/data/dal"

export default async function NewRolePage() {
  await requireRole("employer") // authz at the entry point
  // TODO (M4): <JobForm /> (client) → createJob action via useActionState.
  return <main>{/* new role form */}</main>
}
