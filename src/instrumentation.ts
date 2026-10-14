// instrumentation.ts — the server's observability seam.
//
// onRequestError: every error the Next.js server catches (Server Component
// renders, Route Handlers, Server Actions, the proxy) is logged as ONE JSON
// line. On Vercel these land in the function logs, searchable by `digest` —
// the same reference error.tsx shows the visitor.
//
// Deliberately minimal and privacy-safe: no headers (they carry the session
// cookie), no query string (search terms, callback URLs), no request body.
// Swap the console.error for an APM/OTel exporter later; register() is where
// that would be initialised.
//
// Docs: https://nextjs.org/docs/app/guides/instrumentation
//       https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

import type { Instrumentation } from "next"

export async function register() {
  // Nothing to initialise yet (no tracing provider) — see the header.
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined
  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      message: error instanceof Error ? error.message : String(error),
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
    }),
  )
}
