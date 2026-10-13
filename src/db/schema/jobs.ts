// Job postings ("roles"). The heart of the app: public when published (cached,
// SEO, /roles/[slug]); editable only by the owning company's employer.
//
// `status` drives the caching story: Published/Closed
// Jobs are public and cached; Drafts are private/dynamic.
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core"
import { companies } from "./companies"

export const jobStatus = pgEnum("job_status", ["draft", "published", "closed"])
export const employmentType = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
])

export const jobs = pgTable("job", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(), // public URL: /roles/[slug]
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  remote: text("remote"), // TODO (M2): replace with a `workMode` pgEnum (remote | hybrid | onsite)
  type: employmentType("type").notNull().default("full_time"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  status: jobStatus("status").notNull().default("draft"),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// TODO: add `jobsRelations` → company, applications.
