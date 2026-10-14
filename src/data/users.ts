// User reads & writes. server-only.
//
// getUserForCredentials is the ONE function that returns a passwordHash — it
// exists for the Credentials provider in src/auth.ts and nothing else. Never
// call it from a page, component or action, and never pass its result on.
//
// Docs: https://orm.drizzle.team/docs/insert#on-conflict-do-nothing
//       https://authjs.dev/getting-started/authentication/credentials

import "server-only"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import type { SignupInput } from "@/lib/validations/auth"

// Same cost as the dev seed.
export const BCRYPT_COST = 10

// AUTH ONLY: the login lookup. `email` must already be normalised (lowercase)
// by loginSchema.
export async function getUserForCredentials(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  return user ?? null
}

export type CreateUserResult =
  { ok: true; userId: string } | { ok: false; reason: "email_taken" }

// PUBLIC (signup): creates a Candidate or Employer. The input type only allows
// those two Roles — an Admin can't be created here. The unique email index is
// the real duplicate check; ON CONFLICT turns a race into a clean result.
export async function createUser(
  input: SignupInput,
): Promise<CreateUserResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST)
  const [created] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })
  if (!created) return { ok: false, reason: "email_taken" }
  return { ok: true, userId: created.id }
}
