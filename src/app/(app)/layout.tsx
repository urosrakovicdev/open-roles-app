// Layout for the AUTHENTICATED app section (route group `(app)` → not in URL).
// Renders the dashboard chrome: top bar with sign-out, Role-aware nav.
//
// This layout renders auth-aware UI, but it is NOT the security boundary —
// layouts don't re-render on navigation. Each page and each Server Action
// below calls verifySession()/requireRole() itself. The optimistic redirect
// for signed-out users happens in proxy.ts; the real check lives in the DAL.
//
// No session read at the top level: that would hold {children} behind it.
// Only DashboardNav reads it, inside <Suspense>.
// Docs: https://nextjs.org/docs/app/guides/authentication
//       https://nextjs.org/docs/app/guides/authentication-with-cache-components

import { Suspense } from "react"
import { logoutAction } from "@/actions/auth"
import { Logo } from "@/components/logo"
import { buttonClasses } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { DashboardNav, DashboardNavSkeleton } from "./_components/dashboard-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo />
          <form action={logoutAction}>
            <button
              type="submit"
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Sign out
            </button>
          </form>
        </Container>
      </header>
      <Container className="flex flex-1 flex-col gap-6 py-6 md:flex-row md:gap-10 md:py-10">
        <aside className="md:w-48 md:shrink-0">
          <Suspense fallback={<DashboardNavSkeleton />}>
            <DashboardNav />
          </Suspense>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </Container>
    </div>
  )
}
