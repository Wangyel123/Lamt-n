import { INTERVENTION_TYPES, type InterventionType } from "@/lib/interventions";
import { MIN_GROUP_SIZE, type SafeCell, type SafeTableRow } from "@/lib/suppression";
import { INTERVENTION_TYPE_KEYS } from "@/lib/supervisorSummary";

const cell = (c: SafeCell) =>
  c.kind === "count" ? <span className="tabular font-medium">{c.value}</span> : <span className="text-[13px] text-text-muted">{c.kind === "small" ? `under ${MIN_GROUP_SIZE}` : "not shown"}</span>;

// P-01 for supervisors: how much support was given, by school. Counts only: never notes,
// outcomes or student IDs, and small numbers are hidden exactly like the flag table.
export function InterventionCounts({ rows, demo }: { rows: SafeTableRow<InterventionType>[]; demo: boolean }) {
  return (
    <section aria-labelledby="support-heading" className="space-y-2">
      <h2 id="support-heading" className="px-4 text-[14px] font-semibold tracking-[-0.01em] text-text">
        Support given, by school
      </h2>
      {demo ? (
        <p className="rounded-[14px] border border-separator bg-surface p-4 text-[15px] text-text-muted">
          In this demo, counsellors&apos; actions are saved only in their own browser, so the server can&apos;t count them here. In live mode this
          table shows how many meetings, referrals and other actions each school logged, with small numbers hidden.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-separator bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Number of support actions by type and school. Small numbers are not shown.</caption>
            <thead>
              <tr className="border-b border-separator text-[12px] text-text-muted">
                <th scope="col" className="px-3 py-2.5 font-medium">School</th>
                {INTERVENTION_TYPE_KEYS.map((k) => (
                  <th key={k} scope="col" className="px-3 py-2.5 text-right font-medium">
                    {INTERVENTION_TYPES[k]}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2.5 text-right font-medium">All</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.school} className={`border-t border-separator ${r.kind === "all" ? "bg-bg/60 font-semibold" : ""}`}>
                  <th scope="row" className="px-3 py-2.5 font-semibold">{r.school}</th>
                  {INTERVENTION_TYPE_KEYS.map((k) => (
                    <td key={k} className="px-3 py-2.5 text-right">{cell(r.cells[k])}</td>
                  ))}
                  <td className="px-3 py-2.5 text-right">{cell(r.cells.Total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
