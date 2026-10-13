// Validated environment access. Importing env from here (instead of reading
// process.env scattered around) gives one typed, fail-fast place — and keeps
// server secrets out of any client module.
//
// This module is server-only by intent. NEXT_PUBLIC_* values are
// the only ones safe to expose to the browser, and they're inlined at build.
// Docs: https://nextjs.org/docs/app/guides/environment-variables
//       https://zod.dev/api#urls

import "server-only"
import { z } from "zod"

const schema = z.object({
  // Neon pooled connection string (host contains `-pooler`).
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  AUTH_SECRET: z.string().min(32),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  // Name the bad keys only — never echo a value, it may be a secret.
  const keys = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ")
  throw new Error(
    `Invalid environment variables: ${keys}. Check .env.local against .env.example.`,
  )
}

export const env = parsed.data
