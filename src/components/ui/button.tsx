// Example UI primitive. A plain Server Component (no "use client") — it renders
// markup and has no interactivity of its own. If you need an onClick, either
// pass a Server Action or make the specific interactive piece a Client Component
//.

import type { ButtonHTMLAttributes } from "react"

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  // TODO: real styles (Tailwind) + variants.
  return <button {...props} />
}
