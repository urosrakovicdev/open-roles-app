// /robots.txt — crawl the public site, skip the private and auth pages, and
// point at the sitemap. Not a security control: the private routes are
// protected by the DAL, this just keeps crawlers from wasting time on them.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/", "/login", "/signup"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
