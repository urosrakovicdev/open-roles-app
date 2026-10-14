// "Edit this role" — shown on a Job's public page only to the Employer who
// owns it. A separate dynamic leaf behind <Suspense>: the page's Job data is
// cached and session-free, so ownership can't live in it (ADR-0003). Renders
// nothing for everyone else.
//
// Display only: the edit page and its action re-check ownership in the DAL.
// Docs: https://nextjs.org/docs/app/guides/authentication-with-cache-components

import Link from "next/link"
import { buttonClasses } from "@/components/ui/button"
import { getMyJobIdBySlug } from "@/data/jobs"

export async function OwnerJobLink({ slug }: { slug: string }) {
  const jobId = await getMyJobIdBySlug(slug)
  if (!jobId) return null

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-sm text-fg-muted">You posted this role.</p>
      <Link
        href={`/dashboard/roles/${jobId}/edit`}
        className={buttonClasses({
          variant: "secondary",
          size: "sm",
          className: "mt-2 w-full",
        })}
      >
        Edit this role
      </Link>
    </div>
  )
}
