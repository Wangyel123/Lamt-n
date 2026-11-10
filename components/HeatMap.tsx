"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { FLAG_LEVELS, LEVEL_NAME } from "@/lib/flags";
import { HEAT_SCALE, HEAT_STEPS, heatCell, percent, type HeatCell } from "@/lib/heatmap";
import { MIN_GROUP_SIZE, type SafeRow } from "@/lib/suppression";
import { LEVEL_STYLE } from "./FlagBadge";

const HATCH = "repeating-linear-gradient(135deg, var(--fill) 0 6px, var(--surface) 6px 12px)";

function Cell({ cell, showPercent }: { cell: HeatCell; showPercent: boolean }) {
  if (cell.kind !== "count") {
    return (
      <td className="p-1">
        <div
          className="flex min-h-11 items-center justify-center rounded-lg px-1 text-center text-[12px] text-text-muted"
          style={{ background: HATCH }}
        >
          {cell.kind === "small" ? `under ${MIN_GROUP_SIZE}` : "not shown"}
        </div>
      </td>
    );
  }
  const bg = cell.step === null ? "var(--surface)" : HEAT_SCALE[cell.step];
  const text = showPercent ? (cell.share === null ? "—" : percent(cell.share)) : String(cell.value);
  return (
    <td className="p-1">
      <div
        className={`tabular flex min-h-11 items-center justify-center rounded-lg border border-separator font-semibold ${cell.step === 4 ? "text-white" : "text-text"}`}
        style={{ background: bg }}
        title={cell.share === null ? `${cell.value} students` : `${cell.value} students (${percent(cell.share)})`}
      >
        {text}
      </div>
    </td>
  );
}

// P-03: where are the flags concentrated? Rows are schools (tap to see classes), columns are
// priorities, shade = share of the group. Every cell prints its number (or "under 5"), so colour
// is never the only cue. Same server-suppressed numbers as the table; this component never sees raw counts.
export function HeatMap({ rows }: { rows: SafeRow[] }) {
  const [showPercent, setShowPercent] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const schools = rows.filter((r) => r.kind === "school");
  const toggle = (school: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(school)) next.delete(school);
      else next.add(school);
      return next;
    });

  const renderRow = (r: SafeRow, isClass: boolean) => (
    <tr key={`${r.school}-${r.className ?? "all"}`}>
      <th scope="row" className={`px-2 py-1 text-left ${isClass ? "pl-8 font-normal text-text-muted" : "font-semibold"}`}>
        {isClass ? (
          <>
            <span className="sr-only">{r.school}, </span>Class {r.className}
          </>
        ) : (
          <button
            type="button"
            onClick={() => toggle(r.school)}
            aria-expanded={open.has(r.school)}
            className="inline-flex min-h-11 items-center gap-1"
          >
            <ChevronRight aria-hidden size={16} className={`transition-transform ${open.has(r.school) ? "rotate-90" : ""}`} />
            {r.school}
          </button>
        )}
      </th>
      {FLAG_LEVELS.map((level) => (
        <Cell key={level} cell={heatCell(r.cells[level], r.cells.Total)} showPercent={showPercent} />
      ))}
    </tr>
  );

  return (
    <section aria-labelledby="heat-heading" className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2 px-4">
        <h2 id="heat-heading" className="text-[13px] font-medium tracking-wide text-text-muted uppercase">
          Where flags are concentrated
        </h2>
        <div role="group" aria-label="Show as" className="inline-flex rounded-[10px] bg-fill p-0.5 text-[14px]">
          {[false, true].map((p) => (
            <button
              key={String(p)}
              type="button"
              aria-pressed={showPercent === p}
              onClick={() => setShowPercent(p)}
              className={`min-h-11 rounded-lg px-3 ${showPercent === p ? "bg-surface font-semibold shadow-[0_1px_3px_hsla(0,0%,0%,.15)]" : ""}`}
            >
              {p ? "Percent" : "Numbers"}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-surface p-2">
        <table className="w-full min-w-[420px] border-collapse text-[14px]">
          <caption className="sr-only">Share of students at each priority, by school. Small numbers are hidden.</caption>
          <thead>
            <tr>
              <th scope="col" className="px-2 py-2 text-left text-[12px] font-medium text-text-muted">
                School
              </th>
              {FLAG_LEVELS.map((level) => {
                const { icon: Icon, ink } = LEVEL_STYLE[level];
                return (
                  <th key={level} scope="col" className={`px-1 py-2 text-[12px] font-semibold ${ink}`}>
                    <span className="inline-flex items-center gap-1">
                      <Icon aria-hidden size={13} />
                      {LEVEL_NAME[level]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {schools.flatMap((s) => [
              renderRow(s, false),
              ...(open.has(s.school)
                ? rows.filter((r) => r.kind === "class" && r.school === s.school).map((c) => renderRow(c, true))
                : []),
            ])}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-4 text-[12px] text-text-muted" aria-label="Legend">
        <span>Share of the group:</span>
        {HEAT_STEPS.map((step, i) => (
          <span key={step.label} className="inline-flex items-center gap-1">
            <span
              aria-hidden
              className="inline-block size-3.5 rounded border border-separator"
              style={{ background: HEAT_SCALE[i] }}
            />
            {step.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="inline-block size-3.5 rounded border border-separator" style={{ background: HATCH }} />
          hidden (small number)
        </span>
      </div>
    </section>
  );
}
