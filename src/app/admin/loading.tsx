// Loading UI for the admin route. Gives the page a <Suspense> boundary, so the
// per-request role check (requireRole("admin") at the top of the page) streams
// in after the static shell.
// TODO (M6): on-brand skeleton.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/loading

export default function Loading() {
  return <main aria-busy="true">Loading…</main>
}
