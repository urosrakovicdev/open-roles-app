// What the sitemap lists. server-only, PUBLIC (session-free) and cached.
// Every Public Job (Published or Closed — ADR-0005: Closed pages stay up and
// indexable) and every company.
//
// Tagged BOARD_TAG: every write that can add, remove or change a public URL
// already expires it — publish / close / delete / edit of a Public Job, and
// creating or renaming a company. So the sitemap needs no tag of its own.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
//       https://nextjs.org/docs/app/api-reference/directives/use-cache

import "server-only"
import { inArray } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"
import { db } from "@/db/drizzle"
import { companies, jobs } from "@/db/schema"
import { BOARD_TAG } from "./jobs"

export type SitemapData = {
  jobs: { slug: string; updatedAt: Date }[]
  companies: { slug: string }[]
}

export async function getSitemapData(): Promise<SitemapData> {
  "use cache"
  cacheLife("hours")
  cacheTag(BOARD_TAG)

  const [jobRows, companyRows] = await db.batch([
    db
      .select({ slug: jobs.slug, updatedAt: jobs.updatedAt })
      .from(jobs)
      .where(inArray(jobs.status, ["published", "closed"])),
    db.select({ slug: companies.slug }).from(companies),
  ])
  return { jobs: jobRows, companies: companyRows }
}
