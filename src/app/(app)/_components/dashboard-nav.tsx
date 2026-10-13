// Dashboard navigation that adapts to the user's Role. Reads the session, so
// the (app) layout renders it behind <Suspense>.
//
// NOT a security boundary: hiding a link protects nothing. Every page it
// links to calls verifySession() / requireRole() itself.
// Only routes that exist are listed — M4 adds "My roles" and "Company".

import { Badge } from "@/components/ui/badge"
import { getOptionalSession } from "@/data/dal"
import type { UserRole } from "@/data/dto"
import { roleLabel } from "@/lib/role-labels"
import { NavLink } from "./nav-link"

type NavItem = { href: string; label: string; exact?: boolean }

const OVERVIEW: NavItem = { href: "/dashboard", label: "Overview", exact: true }
const SETTINGS: NavItem = { href: "/dashboard/settings", label: "Settings" }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  candidate: [
    OVERVIEW,
    { href: "/dashboard/applications", label: "My applications" },
    SETTINGS,
  ],
  employer: [
    OVERVIEW,
    { href: "/dashboard/roles/new", label: "Post a role" },
    { href: "/dashboard/applications", label: "Applications" },
    SETTINGS,
  ],
  admin: [OVERVIEW, { href: "/admin", label: "Admin console" }, SETTINGS],
}

export async function DashboardNav() {
  // The page below redirects a signed-out visitor; the nav just stays empty.
  const session = await getOptionalSession()
  if (!session) return null

  return (
    <nav aria-label="Dashboard" className="space-y-3">
      <Badge tone="brand">{roleLabel(session.role)}</Badge>
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {NAV_BY_ROLE[session.role].map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} exact={item.exact}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function DashboardNavSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-3">
      <div className="h-5 w-20 rounded-control bg-surface-muted" />
      <div className="flex flex-wrap gap-1 md:flex-col">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-32 rounded-control bg-surface-muted" />
        ))}
      </div>
    </div>
  )
}
