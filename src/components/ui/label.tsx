// Form label primitive. Always pair with a control via htmlFor/id — labels are
// how screen readers name fields. Server Component.

import type { LabelHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-fg", className)}
      {...props}
    />
  )
}
