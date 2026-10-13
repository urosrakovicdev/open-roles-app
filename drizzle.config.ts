// Drizzle Kit config — tells the migration/introspection CLI where your schema
// lives, where to emit SQL migrations, and how to reach the database.
// Used by: `npm run db:generate | db:migrate | db:push | db:studio`.
// Docs: https://orm.drizzle.team/docs/drizzle-config-file
//       https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon

import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })

export default defineConfig({
  schema: "./src/db/schema", // a folder of table files — Drizzle reads them all
  out: "./migrations", // generated SQL migrations land here (commit them)
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
