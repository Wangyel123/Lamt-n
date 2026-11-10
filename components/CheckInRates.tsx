import { MIN_GROUP_SIZE, type SafeTableRow } from "@/lib/suppression";
import type { RateColumn } from "@/lib/supervisorSummary";

// P-04 for supervisors: how many students answered the check-ins they were sent. Rates only:
// never answers, never IDs. A percentage is shown only when both numbers behind it are shown.
export function CheckInRates({ rows, demo }: { rows: SafeTableRow<RateColumn>[]; demo: boolean }) {
  return (
    <section aria-labelledby="rates-heading" className="space-y-2">
      <h2 id="rates-heading" className="px-4 text-[14px] font-semibold tracking-[-0.01em] text-text">
        Check-in response rates
      </h2>
      {demo || rows.length === 0 ? (
        <p className="rounded-[14px] border border-separator bg-surface p-4 text-[15px] text-text-muted">
          {demo
            ? "In this demo, check-ins are saved only in the browser, so the server can't count them here. In live mode this shows, for each school, how many students answered the check-ins they were sent."
            : "No check-ins have been sent yet."}
        </p>
      ) : (
        <ul className="divide-y divide-separator rounded-[14px] border border-separator bg-surface">
          {rows.map((r) => {
            const a = r.cells.Answered;
            const t = r.cells.Total;
            const rate = a.kind === "count" && t.kind === "count" && t.value > 0 ? `${Math.round((a.value / t.value) * 100)}%` : null;
            const answered = a.kind === "count" ? String(a.value) : a.kind === "small" ? `under ${MIN_GROUP_SIZE}` : "not shown";
            const total = t.kind === "count" ? String(t.value) : t.kind === "small" ? `under ${MIN_GROUP_SIZE}` : "not shown";
            return (
              <li key={r.school} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <span className={r.kind === "all" ? "font-semibold" : "font-medium"}>{r.school}</span>
                <span className="tabular text-[15px] text-text-muted">
                  <span className="font-medium text-text">{answered}</span> of {total} answered{rate ? ` · ${rate}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
