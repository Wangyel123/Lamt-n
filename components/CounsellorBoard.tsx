"use client";

import { OctagonAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { buildRows, type BoardRow } from "@/lib/board";
import { countByLevel } from "@/lib/flags";
import { useFollowUps } from "@/lib/followUpStore";
import { changeNote, changeStatus, type FollowUpStatus } from "@/lib/followUps";
import type { DataReport, Student } from "@/lib/parseCsv";
import { DataCheckPanel } from "./DataCheckPanel";
import { StudentDrawer } from "./StudentDrawer";
import { StudentRow } from "./StudentRow";
import { SummaryCards } from "./SummaryCards";

interface Props {
  students: Student[];
  report: DataReport;
}

export function CounsellorBoard({ students, report }: Props) {
  const { followUps, ready, save } = useFollowUps();
  // Phase 4 adds the on/off toggle. Default ON, as recommended.
  const [useExtraRules] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Flags are computed here from lib/flags.ts on every change, never stored.
  const rows = useMemo(() => buildRows(students, followUps, { useExtraRules }), [students, followUps, useExtraRules]);
  const counts = countByLevel(rows.map((r) => r.flag));
  const urgentRows = rows.filter((r) => r.flag.level === "Urgent");
  const otherRows = rows.filter((r) => r.flag.level !== "Urgent");
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
      <SummaryCards counts={counts} />
      <DataCheckPanel report={report} />

      {/* AC-03: Urgent is pinned in its own section at the very top, whatever else changes. */}
      <section aria-labelledby="urgent-heading" className="space-y-3">
        <h2 id="urgent-heading" className="flex items-center gap-2 text-xl font-bold text-urgent-ink">
          <OctagonAlert aria-hidden size={22} />
          Urgent: see these students first ({urgentRows.length})
        </h2>
        {urgentRows.length > 0 ? (
          <ol className="space-y-3">{urgentRows.map(renderRow)}</ol>
        ) : (
          <p className="text-text-muted">No urgent students.</p>
        )}
      </section>

      <section aria-labelledby="others-heading" className="space-y-3">
        <h2 id="others-heading" className="text-xl font-bold">
          All other students ({otherRows.length})
        </h2>
        <ol className="space-y-3">{otherRows.map(renderRow)}</ol>
      </section>

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
