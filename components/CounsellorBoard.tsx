"use client";

import { OctagonAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { buildRows, type BoardRow } from "@/lib/board";
import { countByLevel, flagStudent } from "@/lib/flags";
import { applyFilters, classOptions, EMPTY_FILTERS, hasActiveFilters, type Filters as FilterValues } from "@/lib/filters";
import { useFollowUps } from "@/lib/followUpStore";
import { changeNote, changeStatus, type FollowUpStatus } from "@/lib/followUps";
import type { DataReport, Student } from "@/lib/parseCsv";
import { DataCheckPanel } from "./DataCheckPanel";
import { Filters } from "./Filters";
import { RulesToggle } from "./RulesToggle";
import { StudentDrawer } from "./StudentDrawer";
import { StudentRow } from "./StudentRow";
import { SummaryCards } from "./SummaryCards";

interface Props {
  students: Student[];
  report: DataReport;
}

export function CounsellorBoard({ students, report }: Props) {
  const { followUps, ready, save } = useFollowUps();
  const [useExtraRules, setUseExtraRules] = useState(true); // default ON, as recommended
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Flags are computed here from lib/flags.ts on every change, never stored.
  const rows = useMemo(() => buildRows(students, followUps, { useExtraRules }), [students, followUps, useExtraRules]);
  const visible = applyFilters(rows, filters);
  // Card counts follow every filter except the level itself, so a card shows what you'd get by clicking it.
  const counts = countByLevel(applyFilters(rows, { ...filters, level: null }).map((r) => r.flag));
  const extraFlaggedCount = useMemo(
    () => students.filter((s) => { const f = flagStudent(s, { useExtraRules: true }); return f.level !== f.baselineLevel; }).length,
    [students],
  );

  const urgentRows = visible.filter((r) => r.flag.level === "Urgent");
  const otherRows = visible.filter((r) => r.flag.level !== "Urgent");
  // AC-03 safety net: Urgent students must never disappear silently behind a filter.
  const hiddenUrgent = rows.filter((r) => r.flag.level === "Urgent").length - urgentRows.length;

  const schools = [...new Set(students.map((s) => s.school))].sort();
  const classes = classOptions(rows, filters.school);
  const selectedRow = rows.find((r) => r.student.studentId === selectedId) ?? null;

  const changeStatusFor = (row: BoardRow) => (to: FollowUpStatus, eventNote: string) =>
    save(row.student.studentId, changeStatus(row.followUp, to, eventNote));

  const renderRow = (row: BoardRow) => (
    <StudentRow
      key={row.student.studentId}
      row={row}
      ready={ready}
      onOpen={() => setSelectedId(row.student.studentId)}
      onStatusChange={changeStatusFor(row)}
    />
  );

  return (
    <div className="space-y-6">
      <SummaryCards counts={counts} selected={filters.level} onSelect={(level) => setFilters({ ...filters, level })} />
      <RulesToggle enabled={useExtraRules} extraFlaggedCount={extraFlaggedCount} onChange={setUseExtraRules} />
      <DataCheckPanel report={report} />
      <Filters filters={filters} schools={schools} classes={classes} onChange={setFilters} />

      <p role="status" aria-live="polite" className="text-sm text-text-muted">
        Showing {visible.length} of {rows.length} students
      </p>

      {/* AC-03: Urgent is pinned in its own section at the very top. */}
      <section aria-labelledby="urgent-heading" className="space-y-3">
        <h2 id="urgent-heading" className="flex items-center gap-2 text-xl font-bold text-urgent-ink">
          <OctagonAlert aria-hidden size={22} />
          Urgent: see these students first ({urgentRows.length})
        </h2>
        {urgentRows.length > 0 && <ol className="space-y-3">{urgentRows.map(renderRow)}</ol>}
        {hiddenUrgent > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed border-urgent bg-urgent-tint p-3">
            <p className="font-bold text-urgent-ink">
              {hiddenUrgent} urgent {hiddenUrgent === 1 ? "student is" : "students are"} hidden by your filters.
            </p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="min-h-11 rounded-lg bg-primary px-4 font-bold text-white"
            >
              Clear filters to show them
            </button>
          </div>
        ) : (
          urgentRows.length === 0 && <p className="text-text-muted">No urgent students.</p>
        )}
      </section>

      {(otherRows.length > 0 || filters.level !== "Urgent") && (
        <section aria-labelledby="others-heading" className="space-y-3">
          <h2 id="others-heading" className="text-xl font-bold">
            {hasActiveFilters(filters) ? "Other matching students" : "All other students"} ({otherRows.length})
          </h2>
          {otherRows.length > 0 ? (
            <ol className="space-y-3">{otherRows.map(renderRow)}</ol>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="font-bold">No students match these filters.</p>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="mt-2 min-h-11 font-bold text-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      )}

      <StudentDrawer
        row={selectedRow}
        ready={ready}
        onClose={() => setSelectedId(null)}
        onStatusChange={(to, note) => (selectedRow ? changeStatusFor(selectedRow)(to, note) : Promise.resolve(false))}
        onNoteSave={(note) =>
          selectedRow ? save(selectedRow.student.studentId, changeNote(selectedRow.followUp, note)) : Promise.resolve(false)
        }
      />
    </div>
  );
}
