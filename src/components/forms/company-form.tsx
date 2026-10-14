"use client"

// The employer's Company form → saveCompanyAction via useActionState. Creates
// the Company on first save, edits it after. The server action decides who
// owns it (the session user); this only collects input and shows state.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://react.dev/reference/react/useActionState

import { useActionState } from "react"
import { saveCompanyAction } from "@/actions/companies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CompanyDTO } from "@/data/dto"
import { FieldError } from "./field-error"

export function CompanyForm({
  company,
  next,
}: {
  company: CompanyDTO | null
  next?: "new-role" // continue to "Post a role" after creating
}) {
  const [state, formAction, pending] = useActionState(saveCompanyAction, null)
  const errors = state?.errors
  // After a submit, show what was sent (React resets the form to defaults).
  const values = state?.fields ?? {
    name: company?.name ?? "",
    description: company?.description ?? "",
    websiteUrl: company?.websiteUrl ?? "",
    logoUrl: company?.logoUrl ?? "",
  }
  const field = (name: keyof typeof values) => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": Boolean(errors?.[name]),
    "aria-describedby": errors?.[name] ? `${name}-error` : undefined,
    className: "mt-1.5",
  })

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.message && (
        <p
          role="status"
          className={
            state.ok
              ? "rounded-control bg-success-soft px-3 py-2 text-sm text-success"
              : "rounded-control bg-danger-soft px-3 py-2 text-sm text-danger"
          }
        >
          {state.message}
        </p>
      )}

      <div>
        <Label htmlFor="name">Company name</Label>
        <Input {...field("name")} required autoComplete="organization" />
        <FieldError id="name-error" messages={errors?.name} />
      </div>

      <div>
        <Label htmlFor="description">About the company</Label>
        <Textarea {...field("description")} rows={5} maxLength={2000} />
        <FieldError id="description-error" messages={errors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="websiteUrl">Website</Label>
          <Input
            {...field("websiteUrl")}
            type="url"
            placeholder="https://"
            autoComplete="url"
          />
          <FieldError id="websiteUrl-error" messages={errors?.websiteUrl} />
        </div>
        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input {...field("logoUrl")} type="url" placeholder="https://" />
          <FieldError id="logoUrl-error" messages={errors?.logoUrl} />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving…"
          : company
            ? "Save changes"
            : next
              ? "Create company and continue"
              : "Create company"}
      </Button>
    </form>
  )
}
