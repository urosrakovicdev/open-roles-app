// Applications ("/dashboard/applications"). The view differs by role:
// candidate → my applications; employer → applications to my roles. The DAL
// returns the correctly-scoped data either way.
// Docs: https://nextjs.org/docs/app/guides/data-security

import { verifySession } from "@/data/dal"

export default async function ApplicationsPage() {
  const session = await verifySession()
  // TODO: if employer → listApplicationsForMyJobs(); else → listMyApplications().
  void session
  return <main>{/* applications */}</main>
}
