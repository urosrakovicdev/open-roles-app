// ROOT layout — wraps every page. Defines <html>/<body> and global providers.
// A Server Component (the default). Renders once around all routes.
//
// Do NOT put auth gating here. Layouts don't
// re-render on navigation, so they're the wrong place for a security check.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/layout

import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "OpenRoles", template: "%s · OpenRoles" },
  description: "A job board for finding and posting roles.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
