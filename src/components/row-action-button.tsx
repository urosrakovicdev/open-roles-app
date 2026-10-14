"use client"

// A submit button for one row action (My roles, the admin console).
// Client only for two things: the pending state (useFormStatus) and, for
// destructive actions, a confirm() before the form submits. The form and its
// Server Action come from the server-rendered list.
// Docs: https://react.dev/reference/react-dom/hooks/useFormStatus

import { useFormStatus } from "react-dom"
import { Button, type ButtonVariant } from "@/components/ui/button"

export function RowActionButton({
  children,
  pendingLabel,
  confirmMessage,
  variant = "secondary",
  label,
}: {
  children: React.ReactNode
  pendingLabel: string
  confirmMessage?: string
  variant?: ButtonVariant
  label?: string // accessible name when the visible text is generic
}) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      disabled={pending}
      aria-label={label}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault()
        }
      }}
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}
