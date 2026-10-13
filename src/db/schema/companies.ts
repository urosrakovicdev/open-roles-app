// Companies — owned by an employer user. A company has many job postings.
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration
//       https://orm.drizzle.team/docs/relations  (for the `relations()` helper)

import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { users } from "./auth"

export const companies = pgTable("company", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(), // used in the public URL /companies/[slug]
  name: text("name").notNull(),
  description: text("description"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  // The employer who owns this company. Ownership = the basis of authorization
  //.
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Relations (owner, jobs) live in ./relations.ts.
