// Loading UI for this dashboard page. Each segment that reads the session
// needs its OWN boundary: the parent dashboard/loading.tsx covers the first
// load, but navigating between sibling pages needs one in the destination
// segment (Next 16.3+ instant-navigation validation).
// TODO (M6): on-brand skeleton.
// Docs: https://nextjs.org/docs/messages/blocking-prerender-dynamic

export default function Loading() {
  return <main aria-busy="true">Loading…</main>
}
