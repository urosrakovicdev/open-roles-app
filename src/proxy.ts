// proxy.ts — Next.js 16 middleware (was middleware.ts pre-16).
// Runs on EVERY matched request, including prefetches.
//
// This is the OPTIMISTIC auth tier. It may only read
// the session cookie for a fast redirect — it must NOT hit the database, and it
// is NOT the security boundary. The real check is re-run in the DAL at every
// data entry point. Re-exporting Auth.js's `auth` gives us that cookie-cheap
// check for free.
//
// Docs: https://authjs.dev/getting-started/installation (Middleware/Proxy)
//       https://nextjs.org/docs/app/api-reference/file-conventions/proxy

export { auth as proxy } from "@/auth"

// Limit where the proxy runs (skip static assets). Protect the (app) dashboard.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
