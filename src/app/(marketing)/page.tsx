// Public landing page ("/"). Marketing + a call to action to browse roles.
// Fully static/cacheable — no per-request data. Great candidate to
// prerender into the static shell.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/page

import Link from "next/link"
import { buttonClasses } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"

const audiences = [
  {
    title: "For candidates",
    points: [
      "Search open roles by keyword, employment type and work mode.",
      "Apply in a few clicks with a cover letter and a link to your CV.",
      "Track every application and its status from your dashboard.",
    ],
    cta: { href: "/roles", label: "Browse roles" },
  },
  {
    title: "For employers",
    points: [
      "Set up your company profile once.",
      "Draft a role, publish it when it's ready, close it when it's filled.",
      "Review applications and move candidates through your pipeline.",
    ],
    cta: { href: "/dashboard/roles/new", label: "Post a role" },
  },
]

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-border bg-surface">
        <Container className="py-16 sm:py-24">
          <p className="text-sm font-medium text-brand">
            The job board for companies and candidates
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Find your next role — or the people to fill it.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-pretty text-fg-muted">
            Companies publish open roles. Candidates search, filter and apply.
            Everyone sees where things stand.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/roles" className={buttonClasses({ size: "lg" })}>
              Browse roles
            </Link>
            <Link
              href="/dashboard/roles/new"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              Post a role
            </Link>
          </div>
        </Container>
      </section>

      <Container className="grid gap-6 py-16 md:grid-cols-2">
        {audiences.map((audience) => (
          <Card as="section" key={audience.title} className="flex flex-col p-6">
            <h2 className="text-lg font-semibold">{audience.title}</h2>
            <ul className="mt-4 flex-1 space-y-3 text-fg-muted">
              {audience.points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-brand"
                  />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={audience.cta.href}
              className="mt-6 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {audience.cta.label} →
            </Link>
          </Card>
        ))}
      </Container>
    </main>
  )
}
