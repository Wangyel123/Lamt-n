import { FLAG_LEVELS } from "@/lib/flags";
import { COLUMNS, MIN_GROUP_SIZE, type SafeCell, type SafeRow } from "@/lib/suppression";
import { LEVEL_STYLE } from "./FlagBadge";

// Server component (no "use client"): it renders already-suppressed counts to HTML.
// It never receives student rows, so it cannot leak them.

const SMALL_LABEL = `<${MIN_GROUP_SIZE}`;

function CellText({ cell }: { cell: SafeCell }) {
  if (cell.kind === "count") return <>{cell.value}</>;
  if (cell.kind === "small") {
    return (
      <span className="text-text-muted">
        {SMALL_LABEL}
        <span className="sr-only"> (fewer than {MIN_GROUP_SIZE}, hidden)</span>
      </span>
    );
  }
  return (
    <span className="text-xs text-text-muted sm:text-sm">
      hidden<span className="sr-only"> to prevent working out a small number</span>
    </span>
  );
}

/** Show each school's total first, then its classes underneath (reads top-down). */
function displayOrder(rows: SafeRow[]): SafeRow[] {
  const ordered: SafeRow[] = [];
  for (const school of rows.filter((r) => r.kind === "school")) {
    ordered.push(school, ...rows.filter((r) => r.kind === "class" && r.school === school.school));
  }
  return [...ordered, ...rows.filter((r) => r.kind === "all")];
}

const cellPad = "px-1.5 py-2 sm:px-3";

export function SupervisorTable({ rows }: { rows: SafeRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <table className="tabular w-full border-collapse text-left text-sm sm:text-base">
        <caption className="sr-only">Flag counts by school and class. Small numbers are hidden.</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={`${cellPad} text-xs font-bold sm:text-sm`}>
              School / class
            </th>
            {FLAG_LEVELS.map((level) => {
              const { icon: Icon, ink } = LEVEL_STYLE[level];
              return (
                <th key={level} scope="col" className={`${cellPad} text-right text-xs font-bold sm:text-sm ${ink}`}>
                  {/* Icon above the label on phones, beside it on wider screens */}
                  <span className="inline-flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-1">
                    <Icon aria-hidden size={14} />
                    {level}
                  </span>
                </th>
              );
            })}
            <th scope="col" className={`${cellPad} text-right text-xs font-bold sm:text-sm`}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {displayOrder(rows).map((row) => {
            const isClass = row.kind === "class";
            return (
              <tr
                key={`${row.school}-${row.className ?? "total"}`}
                className={
                  row.kind === "all"
                    ? "border-t-2 border-text bg-bg font-bold"
                    : row.kind === "school"
                      ? "border-t-2 border-border bg-bg font-bold"
                      : "border-t border-border"
                }
              >
                <th scope="row" className={`${cellPad} ${isClass ? "pl-5 font-normal sm:pl-8" : "font-bold"}`}>
                  {isClass ? (
                    <>
                      <span className="sr-only">{row.school}, </span>Class {row.className}
                    </>
                  ) : (
                    row.school
                  )}
                </th>
                {COLUMNS.map((col) => (
                  <td key={col} className={`${cellPad} text-right`}>
                    <CellText cell={row.cells[col]} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
