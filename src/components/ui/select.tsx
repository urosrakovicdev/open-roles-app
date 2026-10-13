// Native <select> primitive, styled to match Input. Native on purpose:
// accessible, works without JS, and fine for short option lists (employment
// type, work mode). Server Component.

import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "./field-styles"

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(fieldClasses, "h-10 appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      {/* Chevron — decorative, sits over the native arrow we hid. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle"
      >
        <path
          fillRule="evenodd"
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}
