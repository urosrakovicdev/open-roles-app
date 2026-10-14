// Small shared helpers (formatting, slugify, className merge). Pure functions —
// safe to import from server OR client. Keep DB/auth logic OUT of here.

// Join class names, skipping falsy values: cn("a", cond && "b").
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ")
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Not disclosed"
  if (min && max) return `$${min.toLocaleString()}–$${max.toLocaleString()}`
  return `From $${(min ?? max)!.toLocaleString()}`
}

// Cheap shape check for a public slug (what slugify() + a suffix produces).
// Pages run it BEFORE a cached read, so junk URLs don't mint cache entries.
export function isPlausibleSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120
}

// A slug for a new record: slugify(base), capped so a suffix still fits
// isPlausibleSlug(), falling back to `fallback` when nothing is left (a name
// in a non-Latin script). With `suffix`, appends a short random tag.
export function makeSlug(
  base: string,
  { fallback, suffix = false }: { fallback: string; suffix?: boolean },
): string {
  const stem = slugify(base).slice(0, 80).replace(/-+$/, "") || fallback
  return suffix ? `${stem}-${randomSlugSuffix()}` : stem
}

// 6 lowercase base-36 chars (~2 billion values) — enough to make slug
// collisions vanishingly rare; the unique index still catches the rest.
function randomSlugSuffix(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("")
}
