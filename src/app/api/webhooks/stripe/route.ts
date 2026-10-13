// Example webhook Route Handler ("/api/webhooks/stripe"). The "Backend for
// Frontend" use case: external services call HTTP endpoints, not
// Server Actions. Webhooks are unauthenticated by session — verify the
// provider's SIGNATURE instead, and read the raw body.
//
// Route Handlers are public endpoints too — same discipline as
// Server Actions: verify, validate, then act. They coexist with the DAL and can
// delegate to it.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/route
//       https://nextjs.org/docs/app/guides/backend-for-frontend

export async function POST(req: Request) {
  // TODO (stretch): verify the Stripe signature header against the raw body,
  // then handle the event (e.g. mark a "featured role" payment complete).
  void req
  return new Response(null, { status: 200 })
}
