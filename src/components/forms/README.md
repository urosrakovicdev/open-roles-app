# forms/

Client Components that wire a form to a Server Action.

Pattern:

```tsx
"use client"
import { useActionState } from "react"
import { createJob } from "@/actions/jobs"

export function JobForm() {
  const [state, formAction, pending] = useActionState(createJob, null)
  return (
    <form action={formAction}>
      {/* fields */}
      {state?.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Post role</button>
    </form>
  )
}
```

The action does the real work on the server; the form only collects input and
shows pending/error state. Validate in BOTH places, but the server check is the
one that counts.
