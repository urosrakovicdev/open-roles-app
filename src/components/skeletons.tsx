// Loading skeletons for the private pages (dashboard + admin loading.tsx).
// Shapes mirror the real layouts — page heading, stat tiles, card lists,
// form cards — so content streams in without the page jumping. Server
// Components; decorative (aria-hidden), with the busy state on <main>.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/loading

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Bar({ className }: { className: string }) {
  return <div className={cn("rounded bg-surface-muted", className)} />
}

// The whole skeleton page: announces "loading" once, hides the shapes.
export function SkeletonPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main aria-busy="true" className={className}>
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="animate-pulse space-y-6">
        {children}
      </div>
    </main>
  )
}

export function HeadingSkeleton() {
  return (
    <div className="space-y-2">
      <Bar className="h-8 w-48" />
      <Bar className="h-5 w-72 max-w-full" />
    </div>
  )
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="space-y-2 py-4">
          <Bar className="h-4 w-20" />
          <Bar className="h-7 w-10" />
        </Card>
      ))}
    </div>
  )
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex justify-between gap-4">
            <Bar className="h-5 w-1/2" />
            <Bar className="h-5 w-16" />
          </div>
          <Bar className="h-4 w-1/3" />
        </Card>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Card className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Bar className="h-4 w-24" />
          <Bar className="h-10 w-full rounded-control" />
        </div>
      ))}
      <Bar className="h-10 w-32 rounded-control" />
    </Card>
  )
}
