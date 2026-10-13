"use client" // Error boundaries must be Client Components

// Root error boundary — catches errors thrown while rendering any route below
// the root layout. Shows a generic message only: errors from Server Components
// arrive with their details stripped, plus a `digest` to find the server log.
// `retry()` re-fetches and re-renders the failed segment.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/error

import { useEffect } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // TODO (M6): report to the logging set up in instrumentation.ts.
    console.error(error)
  }, [error])

  return (
    <Container className="flex min-h-dvh flex-col py-6">
      <Logo />
      <main className="flex flex-1 flex-col items-start justify-center py-16">
        <p className="text-sm font-medium text-danger">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          This page didn’t load
        </h1>
        <p className="mt-3 max-w-md text-fg-muted">
          It’s probably temporary. Try again, and if it keeps happening, come
          back in a few minutes.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-fg-subtle">
            Reference: <code>{error.digest}</code>
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => retry()}>Try again</Button>
          {/* A plain <a>: a full reload is the safest exit from a broken tree. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex h-10 items-center px-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            Go home
          </a>
        </div>
      </main>
    </Container>
  )
}
