"use client"

// The Job form, shared by "Post a role" and "Edit role". The page hands it
// the action — createJob, or updateJob bound to the Job id — and, when
// editing, the Job's current values. The server action decides everything
// (who you are, whether the Job is yours); this collects input and shows state.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://react.dev/reference/react/useActionState

import Link from "next/link"
import { useActionState } from "react"
import type { JobFormState } from "@/actions/jobs"
import { Button, buttonClasses } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { MyJobDTO } from "@/data/dto"
import { EMPLOYMENT_TYPES, WORK_MODES } from "@/lib/job-labels"
import { FieldError } from "./field-error"

type JobFormProps = {
  action: (state: JobFormState, formData: FormData) => Promise<JobFormState>
  job?: MyJobDTO
  submitLabel: string
}

type FieldName =
  | "title"
  | "description"
  | "location"
  | "type"
  | "workMode"
  | "salaryMin"
  | "salaryMax"

function initialValues(job?: MyJobDTO): Record<FieldName, string> {
  return {
    title: job?.title ?? "",
    description: job?.description ?? "",
    location: job?.location ?? "",
    type: job?.type ?? "full_time",
    workMode: job?.workMode ?? "onsite",
    salaryMin: job?.salaryMin?.toString() ?? "",
    salaryMax: job?.salaryMax?.toString() ?? "",
  }
}

export function JobForm({ action, job, submitLabel }: JobFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const errors = state?.errors
  // After a failed submit, show what was sent (React resets the form).
  const values = { ...initialValues(job), ...state?.fields }
  const field = (name: FieldName, hint?: boolean) => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": Boolean(errors?.[name]),
    "aria-describedby": errors?.[name]
      ? `${name}-error`
      : hint
        ? `${name}-hint`
        : undefined,
    className: "mt-1.5",
  })

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.message && (
        <p
          role="alert"
          className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input {...field("title")} required maxLength={120} />
        <FieldError id="title-error" messages={errors?.title} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          {...field("description", true)}
          required
          rows={12}
          maxLength={10_000}
        />
        {errors?.description ? (
          <FieldError id="description-error" messages={errors.description} />
        ) : (
          <p id="description-hint" className="mt-1.5 text-sm text-fg-subtle">
            Plain text. Leave a blank line between paragraphs; start a line with
            • for a bullet.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="type">Employment type</Label>
          <Select {...field("type")}>
            {EMPLOYMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FieldError id="type-error" messages={errors?.type} />
        </div>
        <div>
          <Label htmlFor="workMode">Work mode</Label>
          <Select {...field("workMode")}>
            {WORK_MODES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FieldError id="workMode-error" messages={errors?.workMode} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            {...field("location")}
            placeholder="e.g. Berlin, Germany"
            maxLength={120}
          />
          <FieldError id="location-error" messages={errors?.location} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-fg">
          Salary <span className="font-normal text-fg-subtle">(optional)</span>
        </legend>
        <p className="text-sm text-fg-subtle">Annual, in US dollars.</p>
        <div className="mt-1.5 grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="salaryMin" className="text-fg-muted">
              Minimum
            </Label>
            <Input {...field("salaryMin")} inputMode="numeric" />
            <FieldError id="salaryMin-error" messages={errors?.salaryMin} />
          </div>
          <div>
            <Label htmlFor="salaryMax" className="text-fg-muted">
              Maximum
            </Label>
            <Input {...field("salaryMax")} inputMode="numeric" />
            <FieldError id="salaryMax-error" messages={errors?.salaryMax} />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href="/dashboard/roles"
          className={buttonClasses({ variant: "ghost" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
