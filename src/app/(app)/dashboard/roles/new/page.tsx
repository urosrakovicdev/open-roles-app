// "Post a role" ("/dashboard/roles/new"). Employer-only. New Jobs start as a
// Draft; publishing happens from My roles. Employers without a Company are
// sent to create one first.
// Docs: https://nextjs.org/docs/app/guides/forms

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createJob } from "@/actions/jobs"
import { JobForm } from "@/components/forms/job-form"
import { Card } from "@/components/ui/card"
import { getMyCompany } from "@/data/companies"

export const metadata: Metadata = { title: "Post a role" }

export default async function NewRolePage() {
  const company = await getMyCompany() // requireRole("employer") inside
  if (!company) redirect("/dashboard/company?from=new-role")

  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Post a role</h1>
      <p className="mt-1 text-fg-muted">
        Saved as a draft for {company.name} — publish it from My roles when it’s
        ready.
      </p>
      <Card className="mt-6">
        <JobForm action={createJob} submitLabel="Save draft" />
      </Card>
    </main>
  )
}
