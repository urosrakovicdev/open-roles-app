// /sitemap.xml — the public, indexable pages: landing, the Board, every
// Public Job and every company. Data from the cached getSitemapData() (tag
// BOARD_TAG), so Job and company writes refresh it.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import type { MetadataRoute } from "next"
import { getSitemapData } from "@/data/sitemap"
import { siteUrl } from "@/lib/env"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { jobs, companies } = await getSitemapData()
  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/roles`, changeFrequency: "daily", priority: 0.9 },
    ...jobs.map((job) => ({
      url: `${siteUrl}/roles/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...companies.map((company) => ({
      url: `${siteUrl}/companies/${company.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
