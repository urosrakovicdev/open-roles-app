// Drizzle relations — what `db.query.*` uses to load related rows
// (`with: { company: true }`). drizzle-orm 0.45 = the v1 relations API
// (`relations()` + one/many). These generate NO SQL: the real foreign keys come
// from `.references()` on the columns. You need both.
// Docs: https://orm.drizzle.team/docs/relations

import { relations } from "drizzle-orm"
import { applications } from "./applications"
import { accounts, users } from "./auth"
import { companies } from "./companies"
import { jobs } from "./jobs"

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  companies: many(companies), // an employer owns their company (one in the UI)
  applications: many(applications), // a candidate's applications
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerId], references: [users.id] }),
  jobs: many(jobs),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
}))

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  candidate: one(users, {
    fields: [applications.candidateId],
    references: [users.id],
  }),
}))
