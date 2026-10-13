// The session-aware corner of the public header: "Sign in" when signed out,
// "Dashboard" + "Sign out" when signed in. The ONE dynamic piece of the
// marketing shell — SiteHeader renders it behind <Suspense>, so the rest of
// every public page stays in the static shell.
//
// Display only: getOptionalSession() is not an authorization check, and both
// links lead somewhere that re-checks through the DAL.
// Docs: https://nextjs.org/docs/app/guides/authentication-with-cache-components

import Link from "next/link"
import { logoutAction } from "@/actions/auth"
import { buttonClasses } from "@/components/ui/button"
import { getOptionalSession } from "@/data/dal"

export async function HeaderAccount() {
  const session = await getOptionalSession()

  if (!session) {
    return (
      <Link
        href="/login"
        className={buttonClasses({ variant: "secondary", size: "sm" })}
      >
        Sign in
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/dashboard"
        className={buttonClasses({ variant: "secondary", size: "sm" })}
      >
        Dashboard
      </Link>
      {/* A form, not a link: signing out is a mutation (POST). Works without JS. */}
      <form action={logoutAction}>
        <button
          type="submit"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Sign out
        </button>
      </form>
    </>
  )
}

// Same footprint as the signed-out button, without committing to either
// state — so neither flashes "Sign in" at a signed-in visitor nor shifts the
// layout when the real thing streams in.
export function HeaderAccountFallback() {
  return (
    <span
      aria-hidden="true"
      className="h-8 w-20 animate-pulse rounded-control bg-surface-muted"
    />
  )
}
