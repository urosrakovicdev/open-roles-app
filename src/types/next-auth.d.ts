// Auth.js module augmentation — teaches the `next-auth` types about our Role.
// The DAL reads `session.user.role`; without this, it doesn't typecheck.
//
// TODO (M3): the jwt/session callbacks in src/auth.ts must actually copy `id`
// and `role` onto the token and session; also augment `JWT` (@auth/core/jwt)
// once the callbacks exist.
// Docs: https://authjs.dev/getting-started/typescript#module-augmentation

import type { userRole } from "@/db/schema"

declare module "next-auth" {
  interface User {
    role?: (typeof userRole.enumValues)[number]
  }
}
