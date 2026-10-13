// Card primitive — a bordered surface for grouping content (Job cards,
// dashboard panels, forms). Server Component. `as` lets a card be an
// <article> or <section> when that's the right semantics.

import type { ElementType, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
}

export function Card({ as: Tag = "div", className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-xs",
        className,
      )}
      {...props}
    />
  )
}
