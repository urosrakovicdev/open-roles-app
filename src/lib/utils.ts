// Small shared helpers (formatting, slugify, className merge). Pure functions —
// safe to import from server OR client. Keep DB/auth logic OUT of here.

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
