// Application MUTATIONS — Server Actions. Public POST endpoints:
// verify session, validate, scope by ownership, then write.
// Docs: https://nextjs.org/docs/app/guides/server-actions

"use server"

import { verifySession } from "@/data/dal"
// import { applySchema } from "@/lib/validations/application"

// A candidate applies to a published role.
export async function applyToJob(_prev: unknown, formData: FormData) {
  const { userId } = await verifySession()
  // TODO (M5):
  // 1. Validate (applySchema) — return expected errors, don't throw.
  // 2. Insert application { jobId, candidateId: userId } (the unique constraint
  //    stops double-applying). NOTE: candidateId comes from the SESSION, never
  //    from the form — that's the take-an-id-from-the-form bug.
  void userId
  void formData
}

// An employer moves an application through its status (reviewing/accepted/…).
export async function setApplicationStatus(_id: string, _status: string) {
  await verifySession()
  // TODO: only if the application's job belongs to the employer's company.
}
