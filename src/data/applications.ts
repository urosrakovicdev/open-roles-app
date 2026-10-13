// Application READS. server-only. The strictest ownership rules in the app
//: a candidate sees only their own; an employer sees only those
// to roles their company owns. Always scope the query by the session.
// Docs: https://nextjs.org/docs/app/guides/data-security

import "server-only"
import { db } from "@/db/drizzle"
import { verifySession } from "./dal"

// Candidate view: my applications.
export async function listMyApplications() {
  const { userId } = await verifySession()
  // TODO: where applications.candidateId === userId. Map to DTOs (+ job title).
  void userId
  return []
}

// Employer view: applications to MY company's roles.
export async function listApplicationsForMyJobs() {
  const { userId } = await verifySession()
  // TODO: join job→company, where company.ownerId === userId. Map to DTOs.
  void userId
  return []
}
