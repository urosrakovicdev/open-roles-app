// Public site footer. Static. No copyright year on purpose: `new Date()` during
// prerender is an "unstable value" under cacheComponents, and a year isn't
// worth making the footer dynamic.

import Link from "next/link"
import { Container } from "@/components/ui/container"

const links = [
  { href: "/roles", label: "Browse roles" },
  { href: "/dashboard/roles/new", label: "Post a role" },
  { href: "/signup", label: "Create an account" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col gap-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p>OpenRoles — a job board for companies and candidates.</p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  )
}
