// Auth MUTATIONS — sign up / sign in / sign out as Server Actions.
// Docs: https://authjs.dev/getting-started/authentication/credentials
//       https://nextjs.org/docs/app/guides/server-actions

"use server"

import { signIn, signOut } from "@/auth"
// import { signupSchema } from "@/lib/validations/auth"
// import { createUser } from "@/data/users"  (M3 — never import db here)

export async function signupAction(_prev: unknown, formData: FormData) {
  // TODO (M3):
  // 1. Validate with zod (return expected errors).
  // 2. Hash the password (bcrypt), insert the user (role defaults to 'candidate').
  // 3. signIn('credentials', { email, password }) to start the session.
  void formData
}

export async function loginAction(_prev: unknown, formData: FormData) {
  // Delegates to Auth.js; catch the AuthError to return a friendly message.
  await signIn("credentials", formData)
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
