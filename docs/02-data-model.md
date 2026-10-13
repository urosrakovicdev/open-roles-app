# 02 · Data model

> Vocabulary follows [`CONTEXT.md`](../CONTEXT.md): a **Job** is a posting, a
> **Role** is a user permission, and a **Public Job** is Published *or* Closed.

The schema lives in [`src/db/schema/`](../src/db/schema), one file per area.
Auth.js additionally needs an `accounts` table (see
[`research/auth-drizzle-schema.md`](research/auth-drizzle-schema.md)); we do
**not** create `sessions`, `verificationTokens` or `authenticators` — the
Credentials provider requires JWT sessions, and magic links / WebAuthn are out
of scope.

## Entities & relationships

```
user (candidate | employer | admin)
  │  owns
  ▼
company ──< job (draft | published | closed)
                 │  receives
                 ▼
            application >── user (the candidate)
```

- A **user** with Role `employer` **owns** a **company** (one per employer in
  the UI; the schema allows more).
- A **company** has many **jobs**.
- A **job** is a **Public Job** — reachable at `/roles/[slug]` — when it is
  `published` **or** `closed`; a `draft` never is. Only `published` jobs appear
  on the Board ([ADR-0005](adr/0005-closed-jobs-stay-publicly-reachable.md)).
- An **application** links a **job** and a candidate **user** — unique per pair.

## Key columns

| Table         | Columns (beyond id / createdAt)                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `user`        | name, email (unique), emailVerified, image, passwordHash, role (`user_role` enum)               |
| `account`     | Auth.js adapter shape (composite PK provider + providerAccountId)                              |
| `company`     | slug (unique), name, description, websiteUrl, logoUrl, ownerId → user                          |
| `job`         | slug (unique), title, description, location, workMode (`work_mode` enum), type (`employment_type` enum), salaryMin, salaryMax, status (`job_status` enum), companyId → company, publishedAt, updatedAt |
| `application` | jobId → job, candidateId → user, coverLetter, resumeUrl, status (`application_status` enum); unique(jobId, candidateId) |

## Why these shapes

- **`ownerId` on company, `companyId` on job.** Ownership is the spine of
  authorization: "can this employer edit this job?" =
  `job.company.ownerId === session.userId`. Every owner query joins through it.
- **`status` enums on job/application.** They drive UX and caching: the Board
  lists `published` Jobs, the detail page also serves `closed`, a `draft` is
  never public. Publishing/closing is when the public cache is invalidated.
- **`slug` on job/company.** Stable, human-readable public URLs and good
  `generateStaticParams` keys. A Job's slug doesn't change after publishing.
- **`passwordHash` on user.** bcrypt hash for the Credentials provider. The
  session payload stays minimal — id + role only.
- **FKs via `.references()`** create real constraints; `relations()` is only for
  the relational query API (`db.query.*`). You need both.

## The DTO boundary

Tables are the *internal* shape. The UI never sees raw rows — the
[`data/`](../src/data) layer maps them to **DTOs** in
[`src/data/dto.ts`](../src/data/dto.ts): only safe fields, plus derived flags
like `isAcceptingApplications`, and never `passwordHash` or another user's data.

> **`JobDetailDTO` must not carry `canEdit`.** The detail read is cached and
> session-free, so a `canEdit` inside it would be either always `false` or the
> first visitor's answer served to everyone. Ownership affordances belong to a
> separate, *dynamic* component fed by its own owner-scoped read.
> See [ADR-0003](adr/0003-use-cache-lives-in-the-dal.md).

## Migrations

Schema is TypeScript. Change a file in `schema/`, then:

```bash
npm run db:generate   # emit a SQL migration into /migrations (commit it)
npm run db:migrate    # apply it to the database
```

Never edit the database by hand, and never use `db:push` against production.
