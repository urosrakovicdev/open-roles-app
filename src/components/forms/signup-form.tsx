"use client"

// Sign-up form → signupAction via useActionState. Name, email, password and
// the Role (Candidate or Employer — never Admin; the server enforces that).
// The server action decides; this only collects input and shows state.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://react.dev/reference/react/useActionState

import { useActionState } from "react"
import { signupAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FieldError } from "./field-error"

const ROLE_OPTIONS = [
  {
    value: "candidate",
    label: "I’m looking for a job",
    hint: "Browse roles and apply.",
  },
  {
    value: "employer",
    label: "I’m hiring",
    hint: "Create a company and post roles.",
  },
] as const

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, null)
  const errors = state?.errors
  const role = state?.fields?.role || "candidate"

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

      <fieldset aria-describedby={errors?.role ? "role-error" : undefined}>
        <legend className="text-sm font-medium text-fg">Account type</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-control border border-border-strong bg-surface p-3 transition-colors",
                "hover:bg-surface-muted has-checked:border-brand has-checked:bg-brand-soft",
                "has-focus-visible:ring-2 has-focus-visible:ring-brand/25",
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                defaultChecked={role === option.value}
                className="mt-0.5 accent-brand"
              />
              <span>
                <span className="block text-sm font-medium text-fg">
                  {option.label}
                </span>
                <span className="block text-sm text-fg-muted">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id="role-error" messages={errors?.role} />
      </fieldset>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          defaultValue={state?.fields?.name}
          aria-invalid={Boolean(errors?.name)}
          aria-describedby={errors?.name ? "name-error" : undefined}
          className="mt-1.5"
        />
        <FieldError id="name-error" messages={errors?.name} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.fields?.email}
          aria-invalid={Boolean(errors?.email)}
          aria-describedby={errors?.email ? "email-error" : undefined}
          className="mt-1.5"
        />
        <FieldError id="email-error" messages={errors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(errors?.password)}
          aria-describedby={
            errors?.password ? "password-error" : "password-hint"
          }
          className="mt-1.5"
        />
        {errors?.password ? (
          <FieldError id="password-error" messages={errors.password} />
        ) : (
          <p id="password-hint" className="mt-1.5 text-sm text-fg-subtle">
            At least 8 characters.
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
