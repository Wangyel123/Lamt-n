import type { Reason } from "@/lib/flags";

// Shows WHY a student is flagged, in plain words (recognition over recall).
// The reason(s) that set the level come first and in bold; others follow normally.
// Reasons from our proposed extra rules are labelled so nobody mistakes them for the brief's rules.
export function Reasons({ reasons }: { reasons: Reason[] }) {
  if (reasons.length === 0) {
    return <p className="text-sm text-text-muted">No concerns from the survey answers.</p>;
  }
  const hasPrimary = reasons.some((r) => r.primary);
  return (
    <p className="text-sm">
      {!hasPrimary && <span className="text-text-muted">Also noted: </span>}
      {reasons.map((r, i) => (
        <span key={r.id}>
          {i > 0 && <span className="text-text-muted"> · </span>}
          <span className={r.primary ? "font-bold" : hasPrimary ? "" : "text-text-muted"}>{r.text}</span>
          {r.extra && (
            <span className="ml-1 rounded bg-none-tint px-1 text-xs text-none-ink">proposed rule</span>
          )}
        </span>
      ))}
    </p>
  );
}
