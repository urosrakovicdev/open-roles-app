// Layout for the AUTHENTICATED app section (route group `(app)` → not in URL).
// Renders the dashboard chrome (sidebar/nav).
//
// This layout may render auth-aware UI, but it is NOT
// the security boundary — layouts don't re-render on navigation. Each page and
// each Server Action below MUST call verifySession()/requireRole() itself. The
// optimistic redirect for logged-out users happens in proxy.ts; the real check
// lives in the DAL.
// Docs: https://nextjs.org/docs/app/guides/authentication

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* TODO: dashboard sidebar/nav + sign-out (logoutAction) */}
      {children}
    </div>
  )
}
