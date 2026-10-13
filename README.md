# OpenRoles

A two-sided job board: companies publish Jobs, candidates browse and apply.
Built on the Next.js 16 App Router with a strict Data Access Layer.

> Working with Claude Code? [`CLAUDE.md`](CLAUDE.md) loads automatically and
> tells the agent how to build this repo milestone by milestone
> ([`docs/04-roadmap.md`](docs/04-roadmap.md)).

## Stack

| Concern    | Choice                       | Docs |
| ---------- | ---------------------------- | ---- |
| Framework  | Next.js 16 (App Router)      | https://nextjs.org/docs |
| Database   | PostgreSQL (Neon serverless) | https://neon.tech/docs |
| ORM        | Drizzle ORM                  | https://orm.drizzle.team |
| Auth       | Auth.js v5 (NextAuth)        | https://authjs.dev |
| Validation | Zod                          | https://zod.dev |
| Styling    | Tailwind CSS v4              | https://tailwindcss.com/docs |

## Getting started

```bash
npm install
cp .env.example .env.local  # fill in DATABASE_URL (pooled Neon string) and AUTH_SECRET (see .env.example)
npm run db:generate         # SQL migrations from src/db/schema
npm run db:migrate          # apply them
npm run db:seed             # sample companies, Jobs, users
npm run dev                 # http://localhost:3000
```

## Project map

```
src/
  app/          routes — (marketing) public, (auth), (app)/dashboard, admin, api
  data/         Data Access Layer — server-only reads/writes, auth, DTOs
  actions/      Server Actions — thin 'use server' mutations that delegate to data/
  db/           Drizzle: connection + schema + seed
  lib/          validations (zod), env, utils
  components/   ui primitives + forms
  auth.ts       Auth.js config        proxy.ts  optimistic auth redirect
docs/           product brief, data model, architecture, roadmap, conventions, ADRs
```

Details: [`docs/05-conventions.md`](docs/05-conventions.md).
