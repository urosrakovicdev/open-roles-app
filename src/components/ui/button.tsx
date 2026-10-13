// Button primitive. A plain Server Component (no "use client") — it renders
// markup and has no interactivity of its own. For an onClick, pass a Server
// Action via `formAction`, or make the specific interactive piece a Client
// Component.
//
// `buttonClasses()` is exported so links that should LOOK like buttons
// (<Link className={buttonClasses({ variant: "secondary" })}>) share the styles
// without nesting a <button> inside an <a>.

import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50"

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-hover",
  secondary:
    "border border-border-strong bg-surface text-fg hover:bg-surface-muted",
  ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
  danger: "bg-danger text-white hover:bg-danger-hover",
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  )
}
