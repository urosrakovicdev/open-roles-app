// Suspense fallbacks for /roles. They're part of the static shell, so they
// must be deterministic (no random widths) and roughly match the final layout
// to avoid a jump when the real content streams in.

import { Card } from "@/components/ui/card"

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-surface-muted ${className}`} />
}

// Same footprint as <RoleFilters /> before it hydrates.
export function RoleFiltersSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid animate-pulse gap-3 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-end"
    >
      {["w-14", "w-10", "w-20"].map((label, i) => (
        <div key={i} className="space-y-1.5">
          <Bar className={`h-5 ${label}`} />
          <Bar className="h-10 w-full rounded-control" />
        </div>
      ))}
      <Bar className="h-10 w-20 rounded-control" />
    </div>
  )
}

export function RoleListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Bar className="h-5 w-28 animate-pulse" />
      {[0, 1, 2].map((i) => (
        <Card key={i} className="animate-pulse space-y-3">
          <Bar className="h-5 w-1/2" />
          <Bar className="h-4 w-1/3" />
          <div className="flex gap-2 pt-1">
            <Bar className="h-5 w-16" />
            <Bar className="h-5 w-16" />
          </div>
        </Card>
      ))}
    </div>
  )
}
