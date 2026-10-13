// Not-found UI for /companies/[slug], rendered inside the site layout. Like
// role pages, the status stays 200 once streaming has started (ADR-0004), and
// Next adds a noindex robots tag.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/not-found

import Link from "next/link"
import { buttonClasses } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

export default function CompanyNotFound() {
  return (
    <main>
      <Container className="py-20">
        <p className="text-sm font-medium text-brand">Company not found</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          We couldn’t find that company
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          The link may be mistyped. You can still browse every open role.
        </p>
        <Link href="/roles" className={buttonClasses({ className: "mt-8" })}>
          Browse open roles
        </Link>
      </Container>
    </main>
  )
}
