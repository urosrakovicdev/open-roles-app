# ADR-0004 · Unknown role slugs return 200, not 404

- **Status:** accepted
- **Date:** 2026-09-08

## Context
With `cacheComponents: true`, PPR is the default and every dynamic route streams
a static shell before the page's own data resolves. The status line goes out
with the first byte:

> "To start streaming, the response headers must be set. This is why it is not
> possible to change the status code after streaming started."
> — [loading.js § Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading)

So by the time `getPublicJobBySlug` returns `null` and the page calls
`notFound()`, the headers are already sent — `notFound()` can only swap the body.
**A 404 status is not reachable from the page.** There is no route-level escape
hatch either: `dynamicParams` is rejected outright under `cacheComponents`,
`instant = false` defers validation rather than rendering, and `connection()`
only pulls a Suspense child out of the shell.

Next's documented fix is to check existence in `proxy.ts` and rewrite missing
slugs to a not-found route — which does yield a real 404 *with* styled UI. But
Next's own docs push the other way in two other places: *"Proxy runs on every
route, including prefetched routes... avoid database checks to prevent
performance issues"* ([Authentication](https://nextjs.org/docs/app/guides/authentication))
and *"Proxy is not intended for slow data fetching"*
([Getting Started: Proxy](https://nextjs.org/docs/app/getting-started/proxy)).
There is no supported way to make such a check cheap: `'use cache'` from proxy is
unsupported, `fetch`'s cache options *"have no effect in Proxy"*, and module-level
caching is ruled out by *"you should not attempt relying on shared modules or
globals"*.

## Decision
`/roles/[slug]` returns **200 with not-found UI** for a slug that doesn't exist.
`proxy.ts` performs **no database read**, so
[`03-architecture.md`](../03-architecture.md) §5 and [ADR-0002](0002-dal-as-the-data-boundary.md)
stand unamended.

## Consequences
- **Easier:** zero cost on the ~99% of role-page requests that are valid — a
  proxy check would have added a Neon round-trip to the critical path of every
  one of them, before the shell could stream, partly undoing the caching in
  [ADR-0003](0003-use-cache-lives-in-the-dal.md). `proxy.ts` stays fast and stays
  outside the security boundary.
- **Not as bad as it sounds:** Next injects
  `<meta name="robots" content="noindex">` into the streamed 404 body *"even if
  the HTTP status is 200"*, so the junk URL is not indexed. And
  [ADR-0005](0005-closed-jobs-stay-publicly-reachable.md) already removed the
  legitimate source of dead job URLs — what's left is typos and bots.
- **Harder:** `/roles/typo` is a soft 404. Crawl budget is spent on URLs that
  should have been rejected outright, and analytics cannot separate missing pages
  by status code.
- **Traded away:** HTTP status correctness, on a page that is otherwise
  SEO-scrupulous.

## Revisit when
Compliance or analytics require a genuine 404 (the two reasons Next itself names),
or Next ships a supported way to cache a proxy-level existence check.

## Alternatives considered
- **DB check in `proxy.ts` + rewrite to a not-found route** — Next's own
  recommendation for this exact problem, and it does produce 404 with styled UI.
  Rejected: it taxes every valid request to fix the invalid ones, it has no
  cacheable implementation, and it is contradicted by Next's guidance on two
  other pages.
- **`await` the read at the top of the page** — not an option. An unlisted slug
  is *"served the App Shell instantly"*, so the shell streams regardless of where
  the `await` sits. This looked like a trade-off and is not one.
- **Produce a 404 response directly from proxy** — gives the status but a bare
  body with no app UI, which is worse for a human than the soft 404.
