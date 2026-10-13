// Signup page ("/signup"). Form → signupAction (Server Action): validate,
// hash the password, create the user, start the session. Fully static — the
// form reads nothing from the request.
// Docs: https://nextjs.org/docs/app/guides/forms

import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "@/components/forms/signup-form"

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
}

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        Apply to roles, or post your own.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
