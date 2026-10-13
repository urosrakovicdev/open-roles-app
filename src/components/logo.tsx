// OpenRoles wordmark — links home. Shared by the marketing header, error pages
// and (later) the dashboard, so it lives in components/, not a _components/.

import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-control font-semibold tracking-tight text-fg",
        className,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-brand">
        <rect width="24" height="24" rx="6" fill="currentColor" />
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
        />
      </svg>
      OpenRoles
    </Link>
  )
}
