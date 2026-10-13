// The database connection — the ONE place a Drizzle client is created.
// Only src/data/* (and the seed script) import `db` from here. Marked
// server-only so a Client Component importing it (directly or transitively)
// becomes a build error — the DB and its credentials stay off the client.
//
// Docs: https://orm.drizzle.team/docs/get-started/neon-new
//       https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon

import "server-only"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/db/schema"
import { env } from "@/lib/env"

// `schema` (tables + relations) is passed so the relational query API
// (db.query.*) knows your tables.
export const db = drizzle(env.DATABASE_URL, { schema })
