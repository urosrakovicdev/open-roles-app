// Public site header: logo → /, "Browse roles", "Post a role", "Sign in".
// Static Server Component. TODO (M3): swap "Sign in" for "Dashboard / Sign out"
// when signed in — as a small dynamic leaf behind <Suspense>, so the rest of
// the header stays in the static shell.

import Link from "next/link"
import { Logo } from "@/components/logo"
import { buttonClasses } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

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
          <Link
            href="/login"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Sign in
          </Link>
        </nav>
      </Container>
    </header>
  )
}
