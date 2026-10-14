// Account-settings MUTATIONS — Server Actions. Public POST endpoints:
// verify → validate (zod) → write (DAL) → refresh. They only ever touch the
// session user; there is no user id in the form to tamper with.
// Docs: https://nextjs.org/docs/app/guides/forms

"use server"

import { refresh } from "next/cache"
import { z } from "zod"
import { verifySession } from "@/data/dal"
import { changeMyPassword, updateMyName } from "@/data/account"
import { changePasswordSchema, profileSchema } from "@/lib/validations/auth"

export type SettingsFormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
  fields?: { name?: string }
} | null

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export async function updateProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await verifySession()
  const fields = { name: text(formData, "name") }
  const parsed = profileSchema.safeParse(fields)
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, fields }
  }
  await updateMyName(parsed.data)
  refresh()
  return { ok: true, message: "Name saved.", fields: parsed.data }
}

// Passwords are never echoed back: on any outcome the form comes back empty.
export async function changePasswordAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await verifySession()
  const parsed = changePasswordSchema.safeParse({
    currentPassword: text(formData, "currentPassword"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  })
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors }
  }
  const result = await changeMyPassword(parsed.data)
  if (!result.ok) {
    return {
      errors: { currentPassword: ["That isn’t your current password."] },
    }
  }
  return { ok: true, message: "Password changed." }
}
