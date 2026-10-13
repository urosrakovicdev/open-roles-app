// Badge primitive — small status/meta labels (work mode, employment type, Job
// status). Server Component.

import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger"

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-fg-muted",
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
