// Validated environment access. Importing env from here (instead of reading
// process.env scattered around) gives one typed, fail-fast place — and keeps
// server secrets out of any client module.
//
// This module is server-only by intent. NEXT_PUBLIC_* values are
// the only ones safe to expose to the browser, and they're inlined at build.
// Docs: https://nextjs.org/docs/app/guides/environment-variables

import "server-only"
import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
})

export const env = schema.parse(process.env)
