// Zod schemas for sign-up, log-in and account-settings input. Shape only —
// whether the email is taken or the password matches is decided by the DAL /
// Auth.js, not here.
// Shared by the Server Actions and the Credentials provider's authorize().
// Docs: https://zod.dev/api  ·  https://authjs.dev/getting-started/authentication/credentials

import { z } from "zod"

// Emails are stored lowercase; normalise before validating so "Ada@X.dev"
// and "ada@x.dev" are the same account.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254))

// Signup picks Candidate or Employer. Admin is never self-assigned — it comes
// from the seed or another Admin.
export const SIGNUP_ROLES = ["candidate", "employer"] as const

const name = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(100, "Keep your name under 100 characters.")

// bcrypt only uses the first 72 bytes of a password; cap it so nothing is
// silently ignored.
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")

export const signupSchema = z.object({
  name,
  email,
  password: newPassword,
  role: z.enum(SIGNUP_ROLES, "Choose candidate or employer."),
})

export type SignupInput = z.infer<typeof signupSchema>

// No length rules on log-in: a wrong password is just "invalid credentials".
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72),
})

export type LoginInput = z.infer<typeof loginSchema>

// Settings › Profile. Only the name is editable (email changes would need
// verification, which is out of scope).
export const profileSchema = z.object({ name })

export type ProfileInput = z.infer<typeof profileSchema>

// Settings › Password. Whether `currentPassword` is right is the DAL's call.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(72),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "The passwords don’t match.",
    path: ["confirmPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
