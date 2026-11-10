// AC-09 chart: "how many students need follow-up in each school", the question a supervisor
// actually asks. One bar per school, in plain words: "14 of 26 students".
//
// Drawn from the SAME suppressed numbers as the table (server-rendered, no chart library):
// when a number is hidden or small we write "under 5" / "not shown" and draw no bar,
// so the chart never hints at a hidden value.

import { MIN_GROUP_SIZE, type SafeRow } from "@/lib/suppression";
import { followUpCell } from "@/lib/supervisorSummary";

export function SupervisorChart({ rows }: { rows: SafeRow[] }) {
  const schools = rows.filter((r) => r.kind === "school");

  return (
    <section aria-labelledby="chart-heading" className="space-y-2">
      <h2 id="chart-heading" className="px-4 text-[14px] font-semibold tracking-[-0.01em] text-text">
        Need follow-up, by school
      </h2>
      <ul className="divide-y divide-separator rounded-[14px] border border-separator bg-surface">
        {schools.map((school) => {
          const total = school.cells.Total;
          const need = followUpCell(school);
          const share = need.kind === "count" && total.kind === "count" && total.value > 0 ? need.value / total.value : null;
          const totalText = total.kind === "count" ? `${total.value} students` : `under ${MIN_GROUP_SIZE} students`;
          const needText = need.kind === "count" ? String(need.value) : need.kind === "small" ? `Under ${MIN_GROUP_SIZE}` : "Not shown";
          return (
            <li key={school.school} className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="font-semibold">{school.school}</span>
                <span className="tabular text-[15px] text-text-muted">
                  <span className="font-medium text-text">{needText}</span> of {totalText}
                </span>
              </div>
              <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-fill">
                {share !== null && <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(share * 100)}%` }} />}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="px-4 text-[13px] text-text-muted">
        &ldquo;Need follow-up&rdquo; means Urgent, High or Review. No bar is drawn when the number is too small to show.
      </p>
    </section>
  );
}
