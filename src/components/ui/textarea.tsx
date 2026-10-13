// Multi-line text primitive (Job descriptions, cover letters). Server Component.

import type { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "./field-styles"

export function Textarea({
  className,
  rows = 5,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldClasses, "py-2 leading-relaxed", className)}
      {...props}
    />
  )
}
