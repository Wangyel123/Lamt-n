// AC-09 chart: flag levels per school, drawn from the SAME suppressed numbers as the table.
//
// Plain HTML/CSS bars, rendered on the server (no chart library, no browser JavaScript):
//   * it only ever receives SafeRow cells ("count", "small", "hidden"), never raw counts;
//   * a hidden number gets NO bar, only its "<5" / "hidden" marker, so the chart never
//     invents or hints at a value;
//   * every bar carries its number as text, plus the level's icon and name, so nothing
//     depends on colour alone. The table above is the full accessible version.

import { FLAG_LEVELS } from "@/lib/flags";
import { MIN_GROUP_SIZE, type SafeCell, type SafeRow } from "@/lib/suppression";
import { LEVEL_STYLE } from "./FlagBadge";
import { T } from "./T";

function Marker({ cell }: { cell: SafeCell }) {
  if (cell.kind === "small") return <span className="text-text-muted">&lt;{MIN_GROUP_SIZE}</span>;
  if (cell.kind === "hidden") return <span className="text-sm text-text-muted">hidden</span>;
  return <span className="tabular font-bold">{cell.value}</span>;
}

export function SupervisorChart({ rows }: { rows: SafeRow[] }) {
  const schools = rows.filter((r) => r.kind === "school");
  // Bar length is relative to the largest SHOWN number (hidden numbers never set the scale).
  const max = Math.max(
    1,
    ...schools.flatMap((r) => FLAG_LEVELS.map((l) => (r.cells[l].kind === "count" ? (r.cells[l] as { value: number }).value : 0))),
  );

  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <figcaption className="mb-4">
        <h2 className="font-bold">
          <T k="supervisor.chartTitle" />
        </h2>
        <p className="text-sm text-text-muted">
          Bar length = number of students. No bar is drawn for a hidden number (&lt;{MIN_GROUP_SIZE} or
          &ldquo;hidden&rdquo;).
        </p>
      </figcaption>

      <div className="space-y-5">
        {schools.map((school) => (
          <section key={school.school} aria-label={school.school}>
            <h3 className="mb-1 text-sm font-bold">{school.school}</h3>
            <ul className="space-y-0.5">
              {FLAG_LEVELS.map((level) => {
                const cell = school.cells[level];
                const { icon: Icon, ink } = LEVEL_STYLE[level];
                const width = cell.kind === "count" ? (cell.value / max) * 100 : 0;
                return (
                  <li key={level} className="flex items-center gap-2 text-sm">
                    <span className={`flex w-20 shrink-0 items-center gap-1 ${ink}`}>
                      <Icon aria-hidden size={14} />
                      <T k={`level.${level}`} />
                    </span>
                    <span className="flex flex-1 items-center gap-2">
                      {width > 0 && (
                        <span
                          aria-hidden
                          className="h-4 rounded-r-[4px]"
                          style={{ width: `calc(${width}% - 3rem)`, minWidth: 4, background: `var(--${level.toLowerCase()})` }}
                        />
                      )}
                      <Marker cell={cell} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </figure>
  );
}
