// Text input primitive. Server Component — forms that need state wrap it in a
// client leaf (components/forms/). Pass aria-invalid to show the error style.

import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "./field-styles"

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, "h-10", className)} {...props} />
}
