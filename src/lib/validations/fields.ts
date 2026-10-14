// Field helpers shared by the form schemas. HTML forms send "" for an empty
// field; these turn that into `undefined`, so "left blank" and "not sent"
// mean the same thing to the DAL.
// Docs: https://zod.dev/api

import { z } from "zod"

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value

// Optional free text, trimmed; blank → undefined.
export function optionalText(max: number, message: string) {
  return z.preprocess(
    blankToUndefined,
    z.string().trim().max(max, message).optional(),
  )
}

// Optional http(s) URL; blank → undefined. No javascript:/data: links — the
// value ends up in an href on a public page.
export function optionalHttpUrl(
  message = "Enter a full URL, like https://example.com.",
) {
  return z.preprocess(
    blankToUndefined,
    z
      .url({ protocol: /^https?$/, hostname: z.regexes.domain, error: message })
      .max(500, "Keep the URL under 500 characters.")
      .optional(),
  )
}
