"use client"

// After a failed submit, move focus to the first invalid field, so keyboard
// and screen-reader users land on what needs fixing instead of on a button
// that just re-enabled. Runs whenever the action state changes; does nothing
// when there's no invalid field (e.g. success, or a form-level message).
// Docs: https://www.w3.org/WAI/tutorials/forms/notifications/

import { useEffect, useRef } from "react"

export function useFocusFirstError(state: unknown) {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus()
  }, [state])
  return formRef
}
