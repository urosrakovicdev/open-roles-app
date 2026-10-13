// Layout for the auth pages (/login, /signup): the wordmark and one centred
// card, no site navigation. Static — no session reads here. Redirecting a
// signed-in user away is the proxy's (optimistic) job.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups

import { Logo } from "@/components/logo"
import { Card } from "@/components/ui/card"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-12 sm:py-20">
      <Logo />
      <Card as="main" className="mt-8 w-full max-w-md p-6 sm:p-8">
        {children}
      </Card>
    </div>
  )
}
