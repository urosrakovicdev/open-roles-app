// Layout for the PUBLIC marketing section. The route group `(marketing)` does
// NOT appear in the URL — it's purely for organising routes and giving the
// public pages a shared header/footer distinct from the dashboard.
// Fully static: no session reads here (M3 adds the signed-in header bits as a
// dynamic leaf behind <Suspense>, not in this layout).
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
