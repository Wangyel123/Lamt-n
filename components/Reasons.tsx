import type { Reason } from "@/lib/flags";

// WHY a student is flagged, in plain words. The reason that set the priority comes first in
// darker text; others follow in grey. Reasons from the extra checks say so.
export function Reasons({ reasons }: { reasons: Reason[] }) {
  if (reasons.length === 0) return <span className="text-text-muted">No worrying answers</span>;
  return (
    <span>
      {reasons.map((r, i) => (
        <span key={r.id}>
          {i > 0 && <span className="text-text-muted"> · </span>}
          <span className={r.primary ? "text-text" : "text-text-muted"}>{r.text}</span>
          {r.extra && <span className="text-[13px] text-text-muted"> · extra check</span>}
        </span>
      ))}
    </span>
  );
}
