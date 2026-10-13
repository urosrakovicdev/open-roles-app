// Layout for the PUBLIC marketing section. The route group `(marketing)` does
// NOT appear in the URL — it's purely for organising routes and giving the
// public pages a shared header/footer distinct from the dashboard.
// No session reads here: the signed-in header bits are a dynamic leaf behind
// <Suspense> inside SiteHeader, so everything else stays in the static shell.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups

import { SiteFooter } from "./_components/site-footer"
import { SiteHeader } from "./_components/site-header"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
