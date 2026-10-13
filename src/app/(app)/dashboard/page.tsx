// Dashboard home ("/dashboard"). Private, dynamic, per-user.
// Entry point → calls verifySession() at the data layer, not in the layout.
// M3: Role-aware quick links. M5 adds per-Role stats (counts).
// Docs: https://nextjs.org/docs/app/guides/authentication

import type { Metadata } from "next"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { verifySession } from "@/data/dal"
import type { UserRole } from "@/data/dto"
import { roleLabel } from "@/lib/role-labels"

export const metadata: Metadata = { title: "Dashboard" }

type QuickLink = { href: string; title: string; description: string }

const QUICK_LINKS: Record<UserRole, QuickLink[]> = {
  candidate: [
    {
      href: "/roles",
      title: "Browse roles",
      description: "Search open roles and apply.",
    },
    {
      href: "/dashboard/applications",
      title: "My applications",
      description: "See where each application stands.",
    },
  ],
  employer: [
    {
      href: "/dashboard/roles/new",
      title: "Post a role",
      description: "Draft a role, then publish it to the Board.",
    },
    {
      href: "/dashboard/applications",
      title: "Applications",
      description: "Review candidates who applied to your roles.",
    },
  ],
  admin: [
    {
      href: "/admin",
      title: "Admin console",
      description: "Moderate roles and manage user Roles.",
    },
    {
      href: "/roles",
      title: "Browse roles",
      description: "See the public Board.",
    },
  ],
}

export default async function DashboardPage() {
  const session = await verifySession() // the real check, at the entry point

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-fg-muted">
        You’re signed in as {aOrAn(roleLabel(session.role))}.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS[session.role].map((link) => (
          <li key={link.href}>
            <Card className="relative h-full transition-colors hover:border-border-strong">
              <h2 className="font-medium">
                {/* The stretched link makes the whole card clickable. */}
                <Link
                  href={link.href}
                  className="after:absolute after:inset-0 after:rounded-card"
                >
                  {link.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-fg-muted">{link.description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  )
}

function aOrAn(label: string) {
  return `${/^[AEIOU]/.test(label) ? "an" : "a"} ${label}`
}
