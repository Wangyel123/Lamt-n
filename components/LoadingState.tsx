// Calm, announced loading message (screen readers hear it via role="status").
// Respects reduced motion: the pulse is turned off by the global prefers-reduced-motion rule.
export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="mx-auto w-full max-w-6xl px-4 py-10">
      <p className="flex items-center gap-3 text-text-muted">
        <span aria-hidden className="inline-block size-3 animate-pulse rounded-full bg-primary" />
        {label}
      </p>
    </div>
  );
}
