// Applications — a candidate applies to a job. A join between users and jobs
// with extra fields. The clearest ownership surface in the app: a candidate may
// only see THEIR applications; an employer only those to THEIR jobs.
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration

import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
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
  (t) => [
    // A candidate can apply to a given job only once. This unique index also
    // serves lookups by job_id (its leading column).
    unique().on(t.jobId, t.candidateId),
    // "My applications" — every candidate query filters by candidate_id.
    index("application_candidate_id_idx").on(t.candidateId),
  ],
)
