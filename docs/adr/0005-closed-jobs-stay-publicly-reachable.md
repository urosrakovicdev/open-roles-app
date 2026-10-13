# ADR-0005 · Closed Jobs stay publicly reachable

- **Status:** accepted
- **Date:** 2026-09-08

## Context
`job.status` is `draft | published | closed`.
[`02-data-model.md`](../02-data-model.md) said "a **job**, when `published`, is
public", which read literally means a Closed Job 404s.

`/roles/[slug]` is the shareable, SEO-critical page, and roles close within
weeks of posting. 404ing them discards every inbound link, every indexed URL and
every share at exactly the moment the URL has accumulated the most of them.

## Decision
The Board lists **Published** Jobs only. `/roles/[slug]` resolves for
**Published or Closed** — the glossary term **Public Job** in
[`CONTEXT.md`](../../CONTEXT.md) — and renders a "no longer accepting
applications" state for Closed. A Draft is never public.

## Consequences
- **Easier:** links, shares and indexed URLs survive a role closing; the genuine
  404 population shrinks to typos and bots; it matches Google's guidance to mark
  a `JobPosting` expired rather than remove it.
- **Harder:** the DAL carries **two deliberately asymmetric predicates** —
  `listPublishedJobs` (Published) and `getPublicJobBySlug` (Published or
  Closed). The names differ because the predicates differ; a reader must not
  assume they match. `JobDetailDTO` carries `isAcceptingApplications` so the page
  can render the closed state, and `02-data-model.md` needed amending.
- **Traded away:** a single, simple "is this Job public?" rule.

## Alternatives considered
- **Published only; Closed 404s** — simplest, and what the data-model doc
  originally said. Rejected: it burns link equity and crawl history on the one
  page whose justification is SEO.
- **301 Closed Jobs to the company page** — preserves some link equity, but the
  visitor doesn't get the content the link promised, and a redirect is a worse
  answer than an honest "this role has closed".
