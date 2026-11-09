import { FLAG_LEVELS, LEVEL_NAME } from "@/lib/flags";
import { COLUMNS, MIN_GROUP_SIZE, type SafeCell, type SafeRow } from "@/lib/suppression";
import { LEVEL_STYLE } from "./FlagBadge";

// Server component (no "use client"): renders already-suppressed counts to HTML.
// It never receives student rows, so it cannot leak them.

function CellText({ cell }: { cell: SafeCell }) {
  if (cell.kind === "count") return <span className="tabular font-medium">{cell.value}</span>;
  return (
    <span className="text-[12px] leading-tight text-text-muted sm:text-[13px]">
      {cell.kind === "small" ? `under ${MIN_GROUP_SIZE}` : "not shown"}
    </span>
  );
}

/** Each school's row first, then its classes underneath (reads top-down). */
function displayOrder(rows: SafeRow[]): SafeRow[] {
  const ordered: SafeRow[] = [];
  for (const school of rows.filter((r) => r.kind === "school")) {
    ordered.push(school, ...rows.filter((r) => r.kind === "class" && r.school === school.school));
  }
  return [...ordered, ...rows.filter((r) => r.kind === "all")];
}

const pad = "px-1.5 py-2.5 sm:px-3";

export function SupervisorTable({ rows }: { rows: SafeRow[] }) {
  return (
    <section aria-labelledby="table-heading" className="space-y-2">
      <h2 id="table-heading" className="px-4 text-[13px] font-medium tracking-wide text-text-muted uppercase">
        By priority, school and class
      </h2>
      <div className="overflow-hidden rounded-2xl bg-surface">
        <table className="w-full border-collapse text-left text-[14px] sm:text-[15px]">
          <caption className="sr-only">Number of students at each priority, by school and class. Small numbers are not shown.</caption>
          <thead>
            <tr className="border-b border-separator text-[12px] sm:text-[13px]">
              <th scope="col" className={`${pad} font-medium text-text-muted`}>
                School / class
              </th>
              {FLAG_LEVELS.map((level) => {
                const { icon: Icon, ink } = LEVEL_STYLE[level];
                return (
                  <th key={level} scope="col" className={`${pad} text-right font-semibold ${ink}`}>
                    <span className="inline-flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-1">
                      <Icon aria-hidden size={13} strokeWidth={2.5} />
                      {LEVEL_NAME[level]}
                    </span>
                  </th>
                );
              })}
              <th scope="col" className={`${pad} text-right font-medium text-text-muted`}>
                Students
              </th>
            </tr>
          </thead>
          <tbody>
            {displayOrder(rows).map((row) => {
              const isClass = row.kind === "class";
              return (
                <tr
                  key={`${row.school}-${row.className ?? "total"}`}
                  className={`border-t border-separator ${row.kind === "class" ? "" : "bg-bg/60 font-semibold"}`}
                >
                  <th scope="row" className={`${pad} ${isClass ? "pl-5 font-normal text-text-muted sm:pl-8" : "font-semibold"}`}>
                    {isClass ? (
                      <>
                        <span className="sr-only">{row.school}, </span>Class {row.className}
                      </>
                    ) : (
                      row.school
                    )}
                  </th>
                  {COLUMNS.map((col) => (
                    <td key={col} className={`${pad} text-right`}>
                      <CellText cell={row.cells[col]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-1 px-4 text-[13px] text-text-muted">
        <p>
          <strong className="font-medium text-text">under {MIN_GROUP_SIZE}</strong>: there are 1 to {MIN_GROUP_SIZE - 1} students
          here, or the whole class is smaller than {MIN_GROUP_SIZE}. We don&apos;t show the exact number, so no child can be singled
          out.
        </p>
        <p>
          <strong className="font-medium text-text">not shown</strong>: a bigger number we also hide, because otherwise someone could
          subtract it from the total and work out a small one.
        </p>
      </div>
    </section>
  );
}
