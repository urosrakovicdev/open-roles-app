"use client"

// One dashboard nav link that knows whether it's the current page
// (aria-current + highlight). The only client piece of the dashboard nav —
// it needs usePathname().
// Docs: https://nextjs.org/docs/app/api-reference/functions/use-pathname

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavLink({
  href,
  exact = false,
  children,
}: {
  href: string
  exact?: boolean // "/dashboard" is only current on itself, not its children
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const current = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "block rounded-control px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        current
          ? "bg-brand-soft text-brand"
          : "text-fg-muted hover:bg-surface-muted hover:text-fg",
      )}
    >
      {children}
    </Link>
  )
}
