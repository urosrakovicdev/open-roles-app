// A field's validation messages, linked to its control via `id` (pass the same
// id to the control's aria-describedby). Renders nothing when there are none.
// Plain component — usable from the client forms in this folder.

export function FieldError({
  id,
  messages,
}: {
  id: string
  messages?: string[]
}) {
  if (!messages?.length) return null
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {messages[0]}
    </p>
  )
}
