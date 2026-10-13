// Applications — a candidate applies to a job. A join between users and jobs
// with extra fields. The clearest ownership surface in the app: a candidate may
// only see THEIR applications; an employer only those to THEIR jobs.
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTable, text, timestamp, pgEnum, unique } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { jobs } from "./jobs"

export const applicationStatus = pgEnum("application_status", [
  "submitted",
  "reviewing",
  "rejected",
  "accepted",
])

export const applications = pgTable(
  "application",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter"),
    resumeUrl: text("resume_url"),
    status: applicationStatus("status").notNull().default("submitted"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // A candidate can apply to a given job only once.
  (t) => [unique().on(t.jobId, t.candidateId)],
)
