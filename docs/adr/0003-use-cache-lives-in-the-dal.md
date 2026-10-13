# ADR-0003 · `use cache` lives in the DAL

- **Status:** accepted
- **Date:** 2026-09-08

## Context
`cacheComponents: true` means nothing is cached unless we say so, and the public
read path (`/roles`, `/roles/[slug]`) is the part we want cached. Those reads are
session-free by nature — but in M2 nothing *enforces* that. Once M3 introduces a
session, the failure mode is quiet: a public read gains a session-dependent
branch, or an owner read reuses a public function behind an `{ includeDrafts }`
flag, and a reviewer cannot distinguish "deliberately unauthenticated" from
"forgot the auth check".

There is also a mechanical constraint. A cached function cannot `await` the
regular `params` prop ([next/root-params](https://nextjs.org/docs/app/api-reference/functions/next-root-params)),
and `next/root-params` does not cover a `[slug]` segment — so `'use cache'`
cannot go on the page component of a dynamic route. The directive has to sit on
something that receives `slug` as an argument: the DAL function, or a
route-level child component.

## Decision
`'use cache'` goes **inside a public read function in `src/data/` when that
function's arguments are bounded**, together with its `cacheTag` and `cacheLife`
calls. Public reads take plain, serializable arguments and never a session.
Owner reads are **separate**, uncached functions that open with
`verifySession()`. The status predicate is never a parameter.

**The bounded-arguments qualifier is load-bearing.** The detail read takes a
slug — one value, drawn from a set the database defines — so its key space is
bounded and caching it in the DAL is safe. The Board read takes a keyword and a
location, both unbounded free text; caching it would let anyone mint unlimited
cache entries with random query strings. So the Board read stays **uncached**,
and its parameterless default view is cached one level up, in a component that
calls the read with no arguments at all. Same principle, different level, chosen
by whether the key space is bounded.

## Consequences
- **Easier:** the trust boundary is enforced by the compiler, not by review.
  Cached functions cannot access `cookies()`, `headers()` or `searchParams`
  ([use-cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)),
  so adding `verifySession()` to a public read is a build error
  (`next-request-in-use-cache`) rather than a missed diff. `generateMetadata`
  and the page share one cache entry, so the detail page costs one query, not
  two. The tag vocabulary lives in the module that knows what a Job is.
- **Harder:** `src/data/` now depends on a Next.js primitive — the DAL is no
  longer framework-portable. Cached reads must return `null` and let the page
  call `notFound()`. Arguments must be RSC-serializable, and closures are
  captured into the cache key, so these functions must close over nothing
  request-scoped.
- **Harder, specifically:** the compiler guarantee covers only the reads that
  are cached. The Board read is a plain function, so nothing structurally stops a
  future caller from adding a session check to it — that one falls back to naming
  discipline and review. Worth knowing which of the two reads is protected by the
  framework and which by convention.
- **Traded away:** a DAL that could move to another framework unchanged.

## Alternatives considered
- **`'use cache'` on a route-level component** — keeps the DAL portable, but
  caches *markup* rather than *data*, so `generateMetadata` queries separately,
  and the session-free property drops back to being a convention.
- **`'use cache'` on the page component** — not available for a dynamic segment;
  see the `params` constraint above.
- **Convention and code review only** — the whole problem is that the failure is
  invisible: a missing auth check and a deliberately public read look identical.
