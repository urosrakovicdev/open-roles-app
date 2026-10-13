// Dev seed — populate the database with sample users, companies, Jobs and
// Applications so the app has something to show. Run with `npm run db:seed`.
//
// A plain Node script (run via tsx), NOT a Next.js route. It must NOT import
// "@/db/drizzle" — that module is `server-only`, which throws outside Next.
// Create a local Drizzle client here with the same schema instead.
//
// Idempotent: one atomic `db.batch()` clears every table (FK order) and
// re-inserts. neon-http has no interactive transactions, but a batch runs as a
// single transaction — a failed seed leaves the previous data intact. Ids and
// slugs are fixed, so URLs stay stable across re-seeds.
// Only ever run against the Neon `dev` branch (CLAUDE.md › Environment).
// Docs: https://orm.drizzle.team/docs/seed-overview
//       https://orm.drizzle.team/docs/batch-api

import bcrypt from "bcryptjs"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/db/schema"

const { users, accounts, companies, jobs, applications } = schema

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — run via `npm run db:seed`.")
}
const db = drizzle(process.env.DATABASE_URL, { schema })

const DEV_PASSWORD = "openroles-dev"

type NewUser = typeof users.$inferInsert
type NewCompany = typeof companies.$inferInsert
type NewJob = typeof jobs.$inferInsert
type NewApplication = typeof applications.$inferInsert

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const daysAgo = (n: number) => new Date(now - n * DAY)

function seedUsers(passwordHash: string): NewUser[] {
  const user = (
    id: string,
    name: string,
    email: string,
    role: NewUser["role"],
  ): NewUser => ({ id, name, email, role, passwordHash })
  return [
    user("user-admin", "Ada Admin", "admin@openroles.dev", "admin"),
    user("user-nora", "Nora Lindqvist", "nora@northwind.dev", "employer"),
    user("user-ben", "Ben Okafor", "ben@brightpath.dev", "employer"),
    user("user-cara", "Cara Mendes", "cara@example.com", "candidate"),
    user("user-dan", "Dan Petrović", "dan@example.com", "candidate"),
    user("user-eli", "Eli Novak", "eli@example.com", "candidate"),
  ]
}

const seedCompanies: NewCompany[] = [
  {
    id: "company-northwind",
    slug: "northwind-labs",
    name: "Northwind Labs",
    description:
      "Northwind Labs builds logistics software for mid-sized shippers: route planning, live tracking and the boring-but-vital paperwork in between. About 60 people across Berlin and Belgrade.",
    websiteUrl: "https://northwind.example.com",
    ownerId: "user-nora",
  },
  {
    id: "company-brightpath",
    slug: "brightpath",
    name: "Brightpath",
    description:
      "Brightpath is a learning platform for adult education providers. Remote-first team of 35, with hubs in Amsterdam and Lisbon.",
    websiteUrl: "https://brightpath.example.com",
    ownerId: "user-ben",
  },
]

const description = (pitch: string, duties: string[], skills: string[]) =>
  [
    pitch,
    "What you'll do:\n" + duties.map((d) => `• ${d}`).join("\n"),
    "What we're looking for:\n" + skills.map((s) => `• ${s}`).join("\n"),
  ].join("\n\n")

function seedJobs(): NewJob[] {
  const NW = "company-northwind"
  const BP = "company-brightpath"
  // Published Jobs are the Board (12 → two pages of 10). Closed stay reachable
  // at their URL (ADR-0005). Drafts are never public.
  // updatedAt is set explicitly: a Closed Job's closing date is derived from
  // it (JobDetailDTO.closedAt → JSON-LD validThrough).
  const published = (days: number) => ({
    status: "published" as const,
    publishedAt: daysAgo(days),
    updatedAt: daysAgo(days),
  })
  // Published `days` ago, closed 30 days after that.
  const closed = (days: number) => ({
    status: "closed" as const,
    publishedAt: daysAgo(days),
    updatedAt: daysAgo(Math.max(1, days - 30)),
  })
  const draft = { status: "draft" as const, publishedAt: null }

  return [
    {
      id: "job-01",
      slug: "senior-frontend-engineer-k3x9",
      title: "Senior Frontend Engineer",
      companyId: NW,
      location: "Berlin, Germany",
      workMode: "hybrid",
      type: "full_time",
      salaryMin: 85000,
      salaryMax: 105000,
      ...published(1),
      description: description(
        "Own the web app our customers' dispatchers live in all day.",
        [
          "Build fast, accessible React interfaces for route planning",
          "Shape our design system with the product designer",
        ],
        ["5+ years with TypeScript and React", "Care for performance and a11y"],
      ),
    },
    {
      id: "job-02",
      slug: "product-designer-p2m7",
      title: "Product Designer",
      companyId: BP,
      location: null,
      workMode: "remote",
      type: "full_time",
      salaryMin: 70000,
      salaryMax: 90000,
      ...published(2),
      description: description(
        "Design the course builder that thousands of teachers use weekly.",
        ["Run discovery with providers", "Ship end-to-end flows in Figma"],
        ["A portfolio of shipped product work", "Comfort with ambiguity"],
      ),
    },
    {
      id: "job-03",
      slug: "backend-engineer-node-q8d1",
      title: "Backend Engineer (Node.js)",
      companyId: NW,
      location: "Belgrade, Serbia",
      workMode: "onsite",
      type: "full_time",
      salaryMin: 60000,
      salaryMax: 80000,
      ...published(3),
      description: description(
        "Scale the services that plan a million deliveries a day.",
        ["Design APIs and data models", "Own services in production"],
        ["Node.js and Postgres experience", "You like reading query plans"],
      ),
    },
    {
      id: "job-04",
      slug: "data-analyst-contract-z4w2",
      title: "Data Analyst",
      companyId: BP,
      location: "Amsterdam, Netherlands",
      workMode: "hybrid",
      type: "contract",
      salaryMin: null,
      salaryMax: null,
      ...published(5),
      description: description(
        "A six-month contract to untangle our learner analytics.",
        ["Model engagement data", "Build dashboards people actually read"],
        ["Strong SQL", "Experience with dbt or similar"],
      ),
    },
    {
      id: "job-05",
      slug: "devops-engineer-r5t3",
      title: "DevOps Engineer",
      companyId: NW,
      location: null,
      workMode: "remote",
      type: "full_time",
      salaryMin: 75000,
      salaryMax: null,
      ...published(6),
      description: description(
        "Keep our platform boring in the best way.",
        ["Run Kubernetes and Terraform", "Improve deploy speed and safety"],
        ["Production cloud experience", "An on-call mindset, shared fairly"],
      ),
    },
    {
      id: "job-06",
      slug: "marketing-intern-h6j8",
      title: "Marketing Intern",
      companyId: BP,
      location: "Lisbon, Portugal",
      workMode: "onsite",
      type: "internship",
      salaryMin: 18000,
      salaryMax: 18000,
      ...published(7),
      description: description(
        "A paid six-month internship in our Lisbon hub.",
        ["Write and test campaign copy", "Help run our webinar series"],
        ["Clear writing", "Curiosity about education"],
      ),
    },
    {
      id: "job-07",
      slug: "technical-writer-part-time-b1n5",
      title: "Technical Writer",
      companyId: NW,
      location: null,
      workMode: "remote",
      type: "part_time",
      salaryMin: 30000,
      salaryMax: 40000,
      ...published(9),
      description: description(
        "Twenty hours a week making our API docs a pleasure to read.",
        ["Write guides and references", "Work closely with engineers"],
        ["Published technical writing", "Can read code"],
      ),
    },
    {
      id: "job-08",
      slug: "customer-success-manager-c7v2",
      title: "Customer Success Manager",
      companyId: BP,
      location: "Amsterdam, Netherlands",
      workMode: "hybrid",
      type: "full_time",
      salaryMin: 55000,
      salaryMax: 65000,
      ...published(10),
      description: description(
        "Be the person our largest providers call first.",
        ["Onboard new providers", "Turn feedback into product input"],
        ["B2B SaaS account experience", "Calm under pressure"],
      ),
    },
    {
      id: "job-09",
      slug: "qa-engineer-contract-m9x4",
      title: "QA Engineer",
      companyId: NW,
      location: "Belgrade, Serbia",
      workMode: "hybrid",
      type: "contract",
      salaryMin: 45000,
      salaryMax: 55000,
      ...published(12),
      description: description(
        "A twelve-month contract to raise our release confidence.",
        ["Design test plans", "Automate the regressions that matter"],
        ["Exploratory testing skill", "Some automation experience"],
      ),
    },
    {
      id: "job-10",
      slug: "engineering-manager-e2k8",
      title: "Engineering Manager",
      companyId: BP,
      location: null,
      workMode: "remote",
      type: "full_time",
      salaryMin: 95000,
      salaryMax: 120000,
      ...published(14),
      description: description(
        "Lead the team of six that owns course delivery.",
        ["Grow and support engineers", "Own delivery with product"],
        ["Prior management experience", "Hands-on technical background"],
      ),
    },
    {
      id: "job-11",
      slug: "mobile-developer-react-native-w3p6",
      title: "Mobile Developer (React Native)",
      companyId: NW,
      location: "Berlin, Germany",
      workMode: "onsite",
      type: "full_time",
      salaryMin: 70000,
      salaryMax: 90000,
      ...published(16),
      description: description(
        "Build the driver app used on every Northwind delivery.",
        ["Ship features to iOS and Android", "Work offline-first"],
        ["React Native in production", "Patience with flaky networks"],
      ),
    },
    {
      id: "job-12",
      slug: "content-designer-part-time-f8r1",
      title: "Content Designer",
      companyId: BP,
      location: "Lisbon, Portugal",
      workMode: "hybrid",
      type: "part_time",
      salaryMin: null,
      salaryMax: null,
      ...published(18),
      description: description(
        "Shape the words inside our product, three days a week.",
        ["Write UI copy and help content", "Run content tests"],
        ["UX writing portfolio", "Fluent English; Portuguese a plus"],
      ),
    },
    // Closed — off the Board, still reachable with a closed banner.
    {
      id: "job-13",
      slug: "support-engineer-t4g7",
      title: "Support Engineer",
      companyId: NW,
      location: "Berlin, Germany",
      workMode: "hybrid",
      type: "full_time",
      salaryMin: 50000,
      salaryMax: 60000,
      ...closed(40),
      description: description(
        "Solve the tricky tickets and fix the root causes.",
        ["Debug customer issues", "Write runbooks"],
        ["Support or ops background", "Comfortable with logs and SQL"],
      ),
    },
    {
      id: "job-14",
      slug: "ux-research-intern-n6d3",
      title: "UX Research Intern",
      companyId: BP,
      location: null,
      workMode: "remote",
      type: "internship",
      salaryMin: 16000,
      salaryMax: 16000,
      ...closed(55),
      description: description(
        "A summer internship with our research team.",
        ["Run interviews", "Synthesize findings"],
        ["Studying HCI, psychology or similar"],
      ),
    },
    // Drafts — never public.
    {
      id: "job-15",
      slug: "staff-engineer-y5h2",
      title: "Staff Engineer",
      companyId: NW,
      location: "Berlin, Germany",
      workMode: "hybrid",
      type: "full_time",
      salaryMin: 110000,
      salaryMax: 135000,
      ...draft,
      description: description(
        "Draft: set technical direction across teams.",
        ["Lead architecture decisions"],
        ["Staff-level experience"],
      ),
    },
    {
      id: "job-16",
      slug: "sales-lead-j7q9",
      title: "Sales Lead",
      companyId: BP,
      location: "Amsterdam, Netherlands",
      workMode: "onsite",
      type: "full_time",
      salaryMin: null,
      salaryMax: null,
      ...draft,
      description: description(
        "Draft: build our provider sales motion.",
        ["Own the pipeline"],
        ["B2B sales leadership"],
      ),
    },
    {
      id: "job-17",
      slug: "security-consultant-u2s8",
      title: "Security Consultant",
      companyId: NW,
      location: null,
      workMode: "remote",
      type: "contract",
      salaryMin: null,
      salaryMax: null,
      ...draft,
      description: description(
        "Draft: a three-month security review.",
        ["Assess our platform"],
        ["Pen-testing experience"],
      ),
    },
  ]
}

const seedApplications: NewApplication[] = [
  {
    id: "app-1",
    jobId: "job-01",
    candidateId: "user-cara",
    coverLetter: "I've built design systems for two logistics products.",
    resumeUrl: "https://example.com/cv/cara.pdf",
    status: "reviewing",
  },
  {
    id: "app-2",
    jobId: "job-03",
    candidateId: "user-dan",
    coverLetter:
      "Node and Postgres are my daily tools — and I live in Belgrade.",
    status: "submitted",
  },
  {
    id: "app-3",
    jobId: "job-02",
    candidateId: "user-eli",
    coverLetter: "Teachers deserve better tools; I'd love to design them.",
    resumeUrl: "https://example.com/cv/eli.pdf",
    status: "accepted",
  },
  {
    id: "app-4",
    jobId: "job-05",
    candidateId: "user-cara",
    status: "rejected",
  },
  {
    // Applied while it was open; the Job has since closed.
    id: "app-5",
    jobId: "job-13",
    candidateId: "user-dan",
    coverLetter: "Happy to take the hardest tickets.",
    status: "submitted",
  },
]

async function main() {
  console.log("Seeding OpenRoles…")
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)
  const seededUsers = seedUsers(passwordHash)
  const seededJobs = seedJobs()

  await db.batch([
    // Clear in FK order (children first). Cascades would cover most of it, but
    // being explicit keeps the seed independent of FK settings.
    db.delete(applications),
    db.delete(jobs),
    db.delete(companies),
    db.delete(accounts),
    db.delete(users),
    db.insert(users).values(seededUsers),
    db.insert(companies).values(seedCompanies),
    db.insert(jobs).values(seededJobs),
    db.insert(applications).values(seedApplications),
  ])

  const count = (status: string) =>
    seededJobs.filter((job) => job.status === status).length
  console.log(
    `Inserted ${seededUsers.length} users, ${seedCompanies.length} companies, ` +
      `${seededJobs.length} Jobs (${count("published")} published, ` +
      `${count("closed")} closed, ${count("draft")} draft), ` +
      `${seedApplications.length} applications.`,
  )
  console.log(`\nDev accounts — password for all: ${DEV_PASSWORD}`)
  for (const user of seededUsers) {
    console.log(`  ${user.role!.padEnd(9)} ${user.email}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
