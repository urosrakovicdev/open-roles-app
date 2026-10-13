// Job MUTATIONS — Server Actions. 'use server' makes every function
// here a PUBLIC POST endpoint, so each one must: (1) verify the session, (2)
// check ownership/role, (3) validate input with zod, BEFORE touching the DB.
// Keep them THIN — delegate real work to data/ and the DB.
//
// Docs: https://nextjs.org/docs/app/guides/server-actions
//       https://nextjs.org/docs/app/api-reference/functions/updateTag

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireRole } from "@/data/dal"
// import { createJobSchema } from "@/lib/validations/job"
// import { updateTag } from "next/cache"

export async function createJob(_prev: unknown, formData: FormData) {
  const session = await requireRole("employer") // authn + authz
  // TODO (M4):
  // 1. const parsed = createJobSchema.safeParse(Object.fromEntries(formData))
  //    → return { error } on failure (expected errors are return values).
  // 2. Insert scoped to the employer's company (ownership — prevents IDOR).
  // 3. Revalidate the board + redirect to the new role.
  void session
  void formData
  revalidatePath("/roles")
  redirect("/dashboard/roles")
}

export async function publishJob(_jobId: string) {
  await requireRole("employer")
  // TODO: set status='published', publishedAt=now() for a job THIS employer owns.
  // Then updateTag(`job-${slug}`) so the public page shows it immediately.
}

export async function deleteJob(_jobId: string) {
  await requireRole("employer")
  // TODO: delete only if the job's company.ownerId === session.userId (IDOR guard).
}
