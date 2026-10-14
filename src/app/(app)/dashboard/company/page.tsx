// My Company ("/dashboard/company"). Employer-only. Create the Company on
// first visit, edit it after. Employers without a Company are sent here from
// "Post a role" (?from=new-role) and continue there once it exists.
// Docs: https://nextjs.org/docs/app/guides/forms

import type { Metadata } from "next"
import Link from "next/link"
import { CompanyForm } from "@/components/forms/company-form"
import { Card } from "@/components/ui/card"
import { getMyCompany } from "@/data/companies"

export const metadata: Metadata = { title: "Company" }

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>
}) {
  const company = await getMyCompany() // requireRole("employer") inside
  const { from } = await searchParams
  const next = !company && from === "new-role" ? "new-role" : undefined

  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        {company ? "Company" : "Create your company"}
      </h1>
      <p className="mt-1 text-fg-muted">
        {company ? (
          <>
            Shown on your roles and on your{" "}
            <Link
              href={`/companies/${company.slug}`}
              className="font-medium text-brand hover:text-brand-hover"
            >
              public profile
            </Link>
            .
          </>
        ) : next ? (
          "Roles are posted under a company — set yours up first."
        ) : (
          "Candidates see this on every role you post."
        )}
      </p>
      <Card className="mt-6">
        <CompanyForm company={company} next={next} />
      </Card>
    </main>
  )
}
