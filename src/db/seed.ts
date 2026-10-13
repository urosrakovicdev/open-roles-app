// Dev seed — populate the database with sample users, companies, Jobs and
// Applications so the app has something to show. Run with `npm run db:seed`.
//
// A plain Node script (run via tsx), NOT a Next.js route. It must NOT import
// "@/db/drizzle" — that module is `server-only`, which throws outside Next.
// Create a local Drizzle client here with the same schema instead.
// Docs: https://orm.drizzle.team/docs/seed-overview

import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "@/db/schema"

const db = drizzle(process.env.DATABASE_URL!, { schema })

async function main() {
  console.log("Seeding OpenRoles…")
  // TODO (M2): idempotent — delete in FK order (applications → jobs →
  // companies → users), then insert: 1 admin, 2 employers each with a company,
  // 3 candidates (bcrypt-hashed dev password), ~15 Jobs across all statuses /
  // types / work modes, a few Applications. Print the dev credentials at the end.
  void db
  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
