// The Apply area of a Job's public page. A dynamic leaf behind <Suspense> —
// the Job data above it is cached and session-free (ADR-0003), so everything
// per-visitor happens here:
//  - Closed Job          → a disabled button (no session needed)
//  - signed out          → "Sign in to apply", back to this page afterwards
//  - Candidate, applied  → "Applied ✓" + a link to track it
//  - Candidate           → the Apply form
//  - Employer / Admin    → nothing (they can't apply)
//
// Display only: applyAction re-checks the Role and the Job's status itself.
// Docs: https://nextjs.org/docs/app/guides/authentication-with-cache-components

import Link from "next/link"
import { ApplyForm } from "@/components/forms/apply-form"
import { Button, buttonClasses } from "@/components/ui/button"
import { hasApplied } from "@/data/applications"
import { getOptionalSession } from "@/data/dal"

export async function ApplyPanel({
  slug,
  isAcceptingApplications,
}: {
  slug: string
  isAcceptingApplications: boolean
}) {
  // Decided from the cached Job alone, so it stays in the static HTML.
  if (!isAcceptingApplications) {
    return (
      <Section>
        <Button disabled className="w-full">
          Applications closed
        </Button>
      </Section>
    )
  }

  const session = await getOptionalSession()
  if (!session) {
    const callbackUrl = encodeURIComponent(`/roles/${slug}`)
    return (
      <Section>
        <Link
          href={`/login?callbackUrl=${callbackUrl}`}
          className={buttonClasses({ className: "w-full" })}
        >
          Sign in to apply
        </Link>
        <p className="mt-2 text-center text-sm text-fg-muted">
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-brand hover:text-brand-hover"
          >
            Create an account
          </Link>
        </p>
      </Section>
    )
  }
  if (session.role !== "candidate") return null

  if (await hasApplied(slug)) {
    return (
      <Section>
        <p
          role="status"
          className="rounded-control bg-success-soft px-3 py-2 text-sm font-medium text-success"
        >
          Applied ✓
        </p>
        <Link
          href="/dashboard/applications"
          className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-hover"
        >
          Track it in My applications
        </Link>
      </Section>
    )
  }

  return (
    <Section title="Apply for this role">
      <ApplyForm jobSlug={slug} />
    </Section>
  )
}

function Section({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div id="apply" className="mt-5 border-t border-border pt-4">
      {title && <h2 className="mb-3 text-sm font-semibold">{title}</h2>}
      {children}
    </div>
  )
}

// Same footprint as the button, without committing to a state.
export function ApplyPanelFallback() {
  return (
    <div aria-hidden="true" className="mt-5 border-t border-border pt-4">
      <div className="h-10 animate-pulse rounded-control bg-surface-muted" />
    </div>
  )
}
