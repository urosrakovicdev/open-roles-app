// Public site header: logo → /, "Browse roles", "Post a role", and the
// account corner ("Sign in", or "Dashboard / Sign out" when signed in).
// Static Server Component; only HeaderAccount reads the session, behind
// <Suspense>, so the rest of the header stays in the static shell.

import Link from "next/link"
import { Suspense } from "react"
import { Logo } from "@/components/logo"
import { buttonClasses } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { HeaderAccount, HeaderAccountFallback } from "./header-account"

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/roles"
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Browse roles
          </Link>
          {/* Hidden on the narrowest screens; the landing CTA covers it. */}
          <Link
            href="/dashboard/roles/new"
            className={buttonClasses({
              variant: "ghost",
              size: "sm",
              className: "hidden sm:inline-flex",
            })}
          >
            Post a role
          </Link>
          <Suspense fallback={<HeaderAccountFallback />}>
            <HeaderAccount />
          </Suspense>
        </nav>
      </Container>
    </header>
  )
}
