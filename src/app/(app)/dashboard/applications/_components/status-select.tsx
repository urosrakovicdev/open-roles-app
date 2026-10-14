"use client"

// The status control for one received Application. With JS, picking a status
// submits the surrounding form straight away (and shows it's saving); without
// JS, a Save button does the same. The form and its Server Action come from
// the server-rendered list.
// Docs: https://react.dev/reference/react-dom/hooks/useFormStatus

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import type { ApplicationStatus } from "@/data/dto"
import { APPLICATION_STATUSES } from "@/lib/application-labels"

export function StatusSelect({
  id,
  status,
  label,
}: {
  id: string
  status: ApplicationStatus
  label: string // accessible name, e.g. "Status for Cara Mendes"
}) {
  const { pending } = useFormStatus()
  return (
    <div className="flex items-center gap-2">
      {/* Sized here: Select's chevron is positioned on its wrapper. */}
      <div className="w-40">
        <Select
          id={id}
          name="status"
          defaultValue={status}
          aria-label={label}
          aria-busy={pending}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {APPLICATION_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      {pending && (
        <span className="text-sm text-fg-subtle" role="status">
          Saving…
        </span>
      )}
      <noscript>
        <Button type="submit" size="sm" variant="secondary">
          Save
        </Button>
      </noscript>
    </div>
  )
}
