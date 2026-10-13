// Shared classes for form controls (Input, Textarea, Select) so they look and
// behave the same. `aria-[invalid=true]:` styles a field the form marked
// invalid — the form sets aria-invalid, the primitive just reacts to it.

export const fieldClasses =
  "w-full rounded-control border border-border-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25"
