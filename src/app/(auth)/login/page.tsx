// Login page ("/login"). The form is a Client Component wired to the
// loginAction Server Action via useActionState; Auth.js verifies the
// credentials.
//
// The heading and links are in the static shell. The form reads
// ?callbackUrl (set by the proxy), a request-time value, so it streams in
// behind <Suspense> — as server HTML, so it still works before JS loads.
// Docs: https://nextjs.org/docs/app/guides/forms
//       https://authjs.dev/getting-started/authentication/credentials

import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LoginForm } from "@/components/forms/login-form"
import { AuthFormSkeleton } from "../_components/auth-form-skeleton"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
}

type LoginSearchParams = Promise<{ callbackUrl?: string | string[] }>

export default function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Sign in to manage your roles and applications.
      </p>
      <div className="mt-6">
        <Suspense fallback={<AuthFormSkeleton fields={2} />}>
          <LoginFormWithCallback searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-fg-muted">
        New to OpenRoles?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  )
}

async function LoginFormWithCallback({
  searchParams,
}: {
  searchParams: LoginSearchParams
}) {
  const { callbackUrl } = await searchParams
  // Passed through as-is; loginAction only honours same-site relative paths.
  return (
    <LoginForm
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
    />
  )
}
