// Company MUTATIONS — Server Actions. Each is a public POST endpoint:
// verify → authorize → validate (zod) → write (DAL) → revalidate.
// The DAL's upsertMyCompany re-checks the Role and takes the owner from the
// session; nothing here trusts an id from the form.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://nextjs.org/docs/app/api-reference/functions/updateTag

"use server"

import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { companyTag, upsertMyCompany } from "@/data/companies"
import { requireRole } from "@/data/dal"
import { BOARD_TAG } from "@/data/jobs"
import { companySchema } from "@/lib/validations/company"

export type CompanyFormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
  fields?: Record<string, string>
} | null

// Where to go after saving, for employers sent here before posting. An
// allowlist, not a URL — nothing from the form becomes a redirect target.
const NEXT_STEPS = { "new-role": "/dashboard/roles/new" } as const

export async function saveCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  await requireRole("employer")

  const fields = Object.fromEntries(
    ["name", "description", "websiteUrl", "logoUrl"].map((key) => {
      const value = formData.get(key)
      return [key, typeof value === "string" ? value : ""]
    }),
  )
  const parsed = companySchema.safeParse(fields)
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }

  const { slug, created } = await upsertMyCompany(parsed.data)

  // The profile page, every Job page showing the company card, and Board
  // cards (company name) — refreshed for the very next request.
  updateTag(companyTag(slug))
  updateTag(BOARD_TAG)

  const next = formData.get("next")
  if (next === "new-role") redirect(NEXT_STEPS[next])

  return {
    ok: true,
    message: created ? "Company created." : "Company saved.",
    fields,
  }
}
