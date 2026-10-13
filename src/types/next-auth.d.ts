// Auth.js module augmentation — teaches the `next-auth` types about our Role.
// The jwt/session callbacks (src/auth.config.ts) copy `id` + `role` from the
// user onto the token, and from the token onto the session; the DAL reads
// `session.user.role`.
// Docs: https://authjs.dev/getting-started/typescript#module-augmentation

import type { UserRole } from "@/data/dto"

declare module "next-auth" {
  interface User {
    role?: UserRole
  }
}

// `next-auth/jwt` only re-exports `@auth/core/jwt`, so augment the source.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    role?: UserRole
  }
}
