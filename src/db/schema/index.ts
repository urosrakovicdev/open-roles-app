// Schema barrel — re-exports every table so both the Drizzle client
// (src/db/drizzle.ts) and Drizzle Kit (drizzle.config.ts points at this folder)
// can see them in one place.
//
// "Schema as code" — your tables are TypeScript. Change a file
// here, run `npm run db:generate` to emit a SQL migration, then `db:migrate`.
// Docs: https://orm.drizzle.team/docs/sql-schema-declaration

export * from "./auth"
export * from "./companies"
export * from "./jobs"
export * from "./applications"
export * from "./relations"
