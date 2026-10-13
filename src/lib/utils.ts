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
