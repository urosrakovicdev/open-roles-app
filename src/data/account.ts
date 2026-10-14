// The signed-in user's own account (Settings). server-only. Every function
// acts on the session user — there is no id parameter to get wrong.
//
// Separate from data/users.ts on purpose: users.ts is imported by src/auth.ts,
// and dal.ts imports auth.ts — so anything that calls verifySession() living
// in users.ts would be an import cycle (dal → auth → users → dal).
//
// Docs: https://authjs.dev/getting-started/authentication/credentials

import "server-only"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db/drizzle"
import { users } from "@/db/schema"
import type { ChangePasswordInput, ProfileInput } from "@/lib/validations/auth"
import { verifySession } from "./dal"
import type { UserRole } from "./dto"
import { BCRYPT_COST } from "./users"

export type MyProfileDTO = {
  name: string | null
  email: string
  role: UserRole
}

// SELF: my profile for the Settings page. Never the hash.
export async function getMyProfile(): Promise<MyProfileDTO> {
  const { userId } = await verifySession()
  const [user] = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  // A valid JWT for a deleted user: treat like signed out.
  if (!user) throw new Error("getMyProfile: session user not found")
  return user
}

// SELF: rename myself.
export async function updateMyName(input: ProfileInput): Promise<void> {
  const { userId } = await verifySession()
  await db.update(users).set({ name: input.name }).where(eq(users.id, userId))
}

export type ChangePasswordResult =
  { ok: true } | { ok: false; reason: "wrong_password" }

// SELF: change my password after re-checking the current one. The hash is
// read and compared here and never leaves this function.
export async function changeMyPassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const { userId } = await verifySession()
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const valid =
    user?.passwordHash &&
    (await bcrypt.compare(input.currentPassword, user.passwordHash))
  if (!valid) return { ok: false, reason: "wrong_password" }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST)
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
  return { ok: true }
}
