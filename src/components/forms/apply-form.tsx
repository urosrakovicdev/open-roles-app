"use client"

// Apply to a Job → applyAction via useActionState. Optional cover letter and
// résumé link. Sends only the Job's slug: who is applying comes from the
// session on the server, and the server decides whether the Job is open.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://react.dev/reference/react/useActionState

import { useActionState } from "react"
import { applyAction } from "@/actions/applications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "./field-error"
import { useFocusFirstError } from "./use-focus-first-error"

export function ApplyForm({ jobSlug }: { jobSlug: string }) {
  const [state, formAction, pending] = useActionState(applyAction, null)
  const formRef = useFocusFirstError(state)
  const errors = state?.errors

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="jobSlug" value={jobSlug} />

      {state?.message && (
        <p
          role="alert"
          className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      <div>
        <Label htmlFor="coverLetter">
          Cover letter{" "}
          <span className="font-normal text-fg-subtle">(optional)</span>
        </Label>
        <Textarea
          id="coverLetter"
          name="coverLetter"
          rows={6}
          maxLength={5000}
          defaultValue={state?.fields?.coverLetter}
          aria-invalid={Boolean(errors?.coverLetter)}
          aria-describedby={
            errors?.coverLetter ? "coverLetter-error" : undefined
          }
          className="mt-1.5"
        />
        <FieldError id="coverLetter-error" messages={errors?.coverLetter} />
      </div>

      <div>
        <Label htmlFor="resumeUrl">
          Résumé link{" "}
          <span className="font-normal text-fg-subtle">(optional)</span>
        </Label>
        <Input
          id="resumeUrl"
          name="resumeUrl"
          type="url"
          placeholder="https://"
          defaultValue={state?.fields?.resumeUrl}
          aria-invalid={Boolean(errors?.resumeUrl)}
          aria-describedby={errors?.resumeUrl ? "resumeUrl-error" : undefined}
          className="mt-1.5"
        />
        <FieldError id="resumeUrl-error" messages={errors?.resumeUrl} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Apply"}
      </Button>
    </form>
  )
}
