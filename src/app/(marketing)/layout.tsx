// Layout for the PUBLIC marketing section. The route group `(marketing)` does
// NOT appear in the URL — it's purely for organising routes and giving the
// public pages a shared header/footer distinct from the dashboard.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* TODO: public site header (logo, "Browse roles", "Sign in") */}
      {children}
      {/* TODO: public footer */}
    </div>
  )
}
