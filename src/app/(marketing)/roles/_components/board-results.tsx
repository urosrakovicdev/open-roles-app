// The Board's results: count, Job list, pagination and empty states.
// Purely presentational — it renders whatever page of results it's handed, so
// both the cached default view and the dynamic filtered view use it.

import Link from "next/link"
import { JobCard } from "@/components/job-card"
import { buttonClasses } from "@/components/ui/button"
import type { JobCardDTO } from "@/data/dto"
import { JOBS_PAGE_SIZE } from "@/data/jobs"

export type BoardFilters = { q?: string; type?: string; workMode?: string }

type BoardResultsProps = {
  items: JobCardDTO[]
  page: number
  totalPages: number
  total: number
  filters: BoardFilters
}

// Build a /roles URL that keeps the active filters and sets the page.
function boardHref(filters: BoardFilters, page: number) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `/roles?${query}` : "/roles"
}

export function BoardResults({
  items,
  page,
  totalPages,
  total,
  filters,
}: BoardResultsProps) {
  const filtered = Boolean(filters.q || filters.type || filters.workMode)

  if (total === 0) {
    return filtered ? <NoMatches /> : <EmptyBoard />
  }

  const first = (page - 1) * JOBS_PAGE_SIZE + 1
  const last = first + items.length - 1

  return (
    <section aria-label="Results" className="space-y-4">
      <p className="text-sm text-fg-muted" aria-live="polite">
        {total === 1 ? "1 role" : `${total} roles`}
        {totalPages > 1 && (
          <>
            {" "}
            · showing {first}–{last}
          </>
        )}
      </p>
      <ul className="space-y-4">
        {items.map((job) => (
          <li key={job.slug}>
            <JobCard job={job} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-4 pt-4"
        >
          <PageLink
            href={boardHref(filters, page - 1)}
            disabled={page <= 1}
            rel="prev"
          >
            ← Previous
          </PageLink>
          <p className="text-sm text-fg-muted">
            Page {page} of {totalPages}
          </p>
          <PageLink
            href={boardHref(filters, page + 1)}
            disabled={page >= totalPages}
            rel="next"
          >
            Next →
          </PageLink>
        </nav>
      )}
    </section>
  )
}

function PageLink({
  href,
  disabled,
  rel,
  children,
}: {
  href: string
  disabled: boolean
  rel: "prev" | "next"
  children: React.ReactNode
}) {
  const className = buttonClasses({ variant: "secondary", size: "sm" })
  if (disabled) {
    // Keep the layout stable; a disabled control, not a dead link.
    return (
      <span aria-disabled="true" className={`${className} opacity-40`}>
        {children}
      </span>
    )
  }
  return (
    <Link href={href} rel={rel} scroll={false} className={className}>
      {children}
    </Link>
  )
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action: { href: string; label: string }
}) {
  return (
    <section
      aria-label="Results"
      className="rounded-card border border-dashed border-border-strong px-6 py-14 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-fg-muted">{body}</p>
      <Link
        href={action.href}
        className={buttonClasses({ variant: "secondary", className: "mt-6" })}
      >
        {action.label}
      </Link>
    </section>
  )
}

function NoMatches() {
  return (
    <EmptyState
      title="No roles match your search"
      body="Try a different keyword, or widen the type and work mode filters."
      action={{ href: "/roles", label: "Clear filters" }}
    />
  )
}

function EmptyBoard() {
  return (
    <EmptyState
      title="No open roles right now"
      body="Check back soon — or, if you're hiring, be the first to post one."
      action={{ href: "/dashboard/roles/new", label: "Post a role" }}
    />
  )
}
