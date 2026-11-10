"use client";

import { CalendarClock, CalendarX } from "lucide-react";
import type { BoardRow } from "@/lib/board";
import type { FollowUpStatus } from "@/lib/followUps";
import { caseload, isOverdue, nextFollowUp, type Intervention } from "@/lib/interventions";
import { StudentRow } from "./StudentRow";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

interface Props {
  rows: BoardRow[];
  interventions: Intervention[];
  ready: boolean;
  onOpen: (studentId: string) => void;
  onStatusChange: (row: BoardRow) => (to: FollowUpStatus, note: string) => Promise<boolean>;
  chips: Map<string, string[]>;
}

// P-01 "My caseload": everyone with an open follow-up, most urgent first, then the most overdue
// check-in date. Overdue is shown with an icon AND words, never colour alone.
export function CaseloadView({ rows, interventions, ready, onOpen, onStatusChange, chips }: Props) {
  const list = caseload(rows, interventions);
  if (list.length === 0) return <p className="rounded-2xl bg-surface p-8 text-center font-medium">No open follow-ups. Everything is closed.</p>;
  return (
    <section className="space-y-2">
      <p className="px-4 text-[15px] text-text-muted">
        {list.length} students with an open follow-up. Most urgent first, then the check-in date that&apos;s due soonest.
      </p>
      <ol className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
        {list.map((row) => {
          const next = nextFollowUp(row.student.studentId, interventions);
          const overdue = isOverdue(next);
          const note = next ? (
            <span className={`inline-flex items-center gap-1 ${overdue ? "font-semibold text-urgent-ink" : "text-text-muted"}`}>
              {overdue ? <CalendarX aria-hidden size={14} /> : <CalendarClock aria-hidden size={14} />}
              {overdue ? "Overdue: " : "Next check-in: "}
              {dateFormat.format(new Date(next))}
            </span>
          ) : (
            <span className="text-text-muted">No check-in date set</span>
          );
          return (
            <StudentRow
              key={row.student.studentId}
              row={row}
              ready={ready}
              onOpen={() => onOpen(row.student.studentId)}
              onStatusChange={onStatusChange(row)}
              note={note}
              reading={chips.get(row.student.studentId)}
            />
          );
        })}
      </ol>
    </section>
  );
}
