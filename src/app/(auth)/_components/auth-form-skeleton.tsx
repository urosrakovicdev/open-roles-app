// Placeholder shown while an auth form streams in: label + input bars and a
// button, sized like the real form so nothing jumps.

export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <div className="h-4 w-20 rounded bg-surface-muted" />
          <div className="mt-1.5 h-10 rounded-control bg-surface-muted" />
        </div>
      ))}
      <div className="h-10 rounded-control bg-surface-muted" />
    </div>
  )
}
