"use client"

// The two Settings forms — profile (name) and password — each wired to its
// Server Action via useActionState. The actions act on the session user only.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://react.dev/reference/react/useActionState

import { useActionState } from "react"
import {
  changePasswordAction,
  updateProfileAction,
  type SettingsFormState,
} from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "./field-error"
import { useFocusFirstError } from "./use-focus-first-error"

function Notice({ state }: { state: SettingsFormState }) {
  if (!state?.message) return null
  return (
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
  )
}

export function ProfileForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null)
  const formRef = useFocusFirstError(state)
  const errors = state?.errors

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <Notice state={state} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={state?.fields?.name ?? name}
          aria-invalid={Boolean(errors?.name)}
          aria-describedby={errors?.name ? "name-error" : undefined}
          className="mt-1.5"
        />
        <FieldError id="name-error" messages={errors?.name} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  )
}

const PASSWORD_FIELDS = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
  },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
  },
] as const

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    null,
  )
  const formRef = useFocusFirstError(state)
  const errors = state?.errors

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <Notice state={state} />
      {PASSWORD_FIELDS.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type="password"
            autoComplete={field.autoComplete}
            required
            aria-invalid={Boolean(errors?.[field.name])}
            aria-describedby={
              errors?.[field.name] ? `${field.name}-error` : undefined
            }
            className="mt-1.5"
          />
          <FieldError
            id={`${field.name}-error`}
            messages={errors?.[field.name]}
          />
        </div>
      ))}
      <Button type="submit" disabled={pending}>
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  )
}
