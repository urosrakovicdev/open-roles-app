// ESLint flat config extending Next.js core-web-vitals + TypeScript rules.
// Docs: https://nextjs.org/docs/app/api-reference/config/eslint
// (M0: if eslint-config-next's export shape differs, follow the docs above.)
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // `_`-prefixed names are deliberately unused (stub args, ignored values).
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "migrations/**",
    "next-env.d.ts",
  ]),
])
