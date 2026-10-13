// Auth.js catch-all Route Handler. Exposes the sign-in/out/callback/session
// endpoints Auth.js needs. The handlers come straight from src/auth.ts — don't
// add logic here.
// Docs: https://authjs.dev/getting-started/installation

import { handlers } from "@/auth"

export const { GET, POST } = handlers
