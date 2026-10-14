// ROOT layout — wraps every page. Defines <html>/<body> and global providers.
// A Server Component (the default). Renders once around all routes.
//
// Do NOT put auth gating here. Layouts don't
// re-render on navigation, so they're the wrong place for a security check.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/layout

import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { siteUrl } from "@/lib/env"
import "./globals.css"

// Self-hosted at build time by next/font; exposed as a CSS variable that the
// `--font-sans` token in globals.css points at.
// Docs: https://nextjs.org/docs/app/api-reference/components/font
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  // Resolves every relative canonical / Open Graph URL to an absolute one.
  metadataBase: new URL(siteUrl),
  title: { default: "OpenRoles", template: "%s · OpenRoles" },
  description: "A job board for finding and posting roles.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  )
}
