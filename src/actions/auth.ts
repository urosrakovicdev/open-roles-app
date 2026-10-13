// Auth MUTATIONS — sign up / log in / sign out as Server Actions.
// Each is a public POST endpoint. Expected failures (bad input, taken email,
// wrong password) are RETURNED for useActionState, never thrown.
// Docs: https://authjs.dev/getting-started/authentication/credentials
//       https://nextjs.org/docs/app/guides/forms

"use server"

import { AuthError } from "next-auth"
import { z } from "zod"
import { signIn, signOut } from "@/auth"
import { createUser } from "@/data/users"
import { loginSchema, signupSchema } from "@/lib/validations/auth"

// The shape both auth forms read. `fields` echoes what was typed (never the
// password) so a failed submit doesn't wipe the form.
export type AuthFormState = {
  message?: string
  errors?: Record<string, string[] | undefined>
  fields?: { name?: string; email?: string; role?: string }
} | null

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

// Only same-site relative paths: "/dashboard/roles" yes; "//evil.com",
// "/\evil.com" or "https://…" no (open-redirect guard).
function safeCallbackUrl(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value
  }
  return "/dashboard"
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fields = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    role: text(formData, "role"),
  }
  const parsed = signupSchema.safeParse({
    ...fields,
    password: text(formData, "password"),
  })
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }

  const result = await createUser(parsed.data)
  if (!result.ok) {
    return {
      errors: { email: ["An account with this email already exists."] },
      fields,
    }
  }

  // Start the session with the credentials just stored. On success signIn
  // throws a redirect, which must propagate.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Your account was created — please log in.", fields }
    }
    throw error
  }
  return null
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fields = { email: text(formData, "email") }
  const parsed = loginSchema.safeParse({
    ...fields,
    password: text(formData, "password"),
  })
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(text(formData, "callbackUrl")),
    })
  } catch (error) {
    // AuthError = Auth.js said no. Anything else (incl. the success redirect)
    // is rethrown.
    if (error instanceof AuthError) {
      return {
        // One message for unknown email and wrong password alike.
        message:
          error.type === "CredentialsSignin"
            ? "Invalid email or password."
            : "Something went wrong. Please try again.",
        fields,
      }
    }
    throw error
  }
  return null
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
