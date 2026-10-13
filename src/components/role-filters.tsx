"use client"

// The Board's search + filter bar — the ONE interactive leaf on /roles.
// State lives in the URL (q, type, workMode; page resets on any change), so a
// filtered Board is shareable and the server renders the results.
//
// Progressive enhancement: it's a real GET form to /roles, so it works before
// JS loads; with JS, selects apply immediately and navigation runs in a
// transition (the old results stay visible while the new ones stream in).
//
// Uses useSearchParams, so the page must wrap it in <Suspense>.
// Docs: https://nextjs.org/docs/app/api-reference/functions/use-search-params

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { EMPLOYMENT_TYPES, WORK_MODES } from "@/lib/job-labels"

const FILTER_KEYS = ["q", "type", "workMode"] as const

export function RoleFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function apply(form: HTMLFormElement) {
    const data = new FormData(form)
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const value = String(data.get(key) ?? "").trim()
      if (value) params.set(key, value)
    }
    // No `page`: any filter change starts from page 1.
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    apply(event.currentTarget)
  }

  const q = searchParams.get("q") ?? ""
  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key))

  return (
    <form
      role="search"
      action="/roles"
      method="get"
      onSubmit={onSubmit}
      aria-busy={isPending}
      className="grid gap-3 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="filter-q">Search</Label>
        <Input
          // Re-mount when the URL changes (back/forward) so the box follows it.
          key={q}
          id="filter-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Title, company or location"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-type">Type</Label>
        <Select
          id="filter-type"
          name="type"
          key={searchParams.get("type")}
          defaultValue={searchParams.get("type") ?? ""}
          onChange={(event) => apply(event.currentTarget.form!)}
        >
          <option value="">Any type</option>
          {EMPLOYMENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-work-mode">Work mode</Label>
        <Select
          id="filter-work-mode"
          name="workMode"
          key={searchParams.get("workMode")}
          defaultValue={searchParams.get("workMode") ?? ""}
          onChange={(event) => apply(event.currentTarget.form!)}
        >
          <option value="">Any work mode</option>
          {WORK_MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Searching…" : "Search"}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() =>
              startTransition(() => router.push(pathname, { scroll: false }))
            }
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  )
}
