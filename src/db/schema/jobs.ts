// Job postings ("roles"). The heart of the app: public when published (cached,
// SEO, /roles/[slug]); editable only by the owning company's employer.
//
// `status` drives the caching story: Published/Closed
// Jobs are public and cached; Drafts are private/dynamic.
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration
//       https://orm.drizzle.team/docs/indexes-constraints

import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { companies } from "./companies"

export const jobStatus = pgEnum("job_status", ["draft", "published", "closed"])
export const employmentType = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
])
// Where the Job is performed (CONTEXT.md › Work mode).
export const workMode = pgEnum("work_mode", ["remote", "hybrid", "onsite"])

export const jobs = pgTable(
  "job",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(), // public URL: /roles/[slug]
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location"),
    workMode: workMode("work_mode").notNull().default("onsite"),
    type: employmentType("type").notNull().default("full_time"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    status: jobStatus("status").notNull().default("draft"),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // The Board: WHERE status = 'published' ORDER BY published_at DESC.
    index("job_status_published_at_idx").on(t.status, t.publishedAt),
    // Company pages and every owner query join through company_id.
    index("job_company_id_idx").on(t.companyId),
  ],
)

// Relations live in ./relations.ts (jobs ↔ applications would otherwise be a
// circular import).
