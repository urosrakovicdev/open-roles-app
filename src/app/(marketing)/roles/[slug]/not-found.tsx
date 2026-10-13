// Soft-404 UI for /roles/[slug] (ADR-0004): unknown slugs and Drafts render
// this inside the site layout. The status stays 200 — headers are sent before
// the page knows the slug is missing — but Next adds a noindex robots tag.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/not-found

import Link from "next/link"
import { buttonClasses } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

export default function RoleNotFound() {
  return (
    <main>
      <Container className="py-20">
        <p className="text-sm font-medium text-brand">Role not found</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          We couldn’t find that role
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          The link may be mistyped, or the role was never published. Closed
          roles stay online, so this one probably didn’t exist.
        </p>
        <Link href="/roles" className={buttonClasses({ className: "mt-8" })}>
          Browse open roles
        </Link>
      </Container>
    </main>
  )
}
