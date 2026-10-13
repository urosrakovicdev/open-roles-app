// Container primitive — centers content with a max width and a 16px side
// gutter (24px from sm up), so pages line up and nothing touches the edge
// down to 360px. Server Component.

import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6", className)}
      {...props}
    />
  )
}
