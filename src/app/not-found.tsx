// Root 404 page — rendered for unknown URLs and for notFound() calls that no
// closer not-found.tsx handles. Static. It sits outside (marketing), so it
// brings its own minimal chrome (logo) instead of the full site header.
// Note: unknown /roles/[slug] gets soft-404 UI on the page itself (ADR-0004).
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/not-found

import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { buttonClasses } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <Container className="flex min-h-dvh flex-col py-6">
      <Logo />
      <main className="flex flex-1 flex-col items-start justify-center py-16">
        <p className="text-sm font-medium text-brand">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          We couldn’t find that page
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/roles" className={buttonClasses()}>
            Browse roles
          </Link>
          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Go home
          </Link>
        </div>
      </main>
    </Container>
  )
}
