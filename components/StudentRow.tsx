"use client";

import { ChevronRight } from "lucide-react";
import type { BoardRow } from "@/lib/board";
import type { Reason } from "@/lib/flags";
import { formatTime } from "@/lib/format";
import type { FollowUpStatus } from "@/lib/followUps";
import { PriorityDot } from "./FlagBadge";
import { NeedsReadingChip } from "./NeedsReading";
import { Reasons } from "./Reasons";
import { StatusControl } from "./StatusControl";

interface Props {
  row: BoardRow;
  ready: boolean;
  onOpen: () => void;
  onStatusChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>;
  note?: React.ReactNode; // extra line under the reasons (e.g. the next check-in date in Caseload)
  reading?: string[]; // P-02: unread "Needs reading" categories for this student
  extraReasons?: Reason[]; // P-04: e.g. "Check-in: needs follow-up" (never changes the level)
}

// One student as a row. Left: who and why (tap for details). Right: your follow-up.
// Urgent rows get a thin red edge; the section heading and the word "Urgent" say it too.
export function StudentRow({ row, ready, onOpen, onStatusChange, note, reading, extraReasons = [] }: Props) {
  const { student, flag, followUp, status } = row;

  return (
    <li className="relative flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-fill/50 sm:flex-row sm:items-center sm:gap-6">
      {flag.level === "Urgent" && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-urgent" />}

      <button type="button" onClick={onOpen} className="flex min-h-11 flex-1 items-start gap-3 rounded-[10px] text-left">
        <PriorityDot level={flag.level} className="mt-[7px]" />
        <span className="min-w-0 flex-1">
          <span className="sr-only">Open details for </span>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-[14px] font-medium">{student.studentId}</span>
            <span className="text-[14px] text-text-muted">
              {student.school} · Class {student.className}
            </span>
            {flag.needsCheck && <span className="rounded-md border border-separator px-1.5 text-[12px] text-text-muted">Answer missing</span>}
            {reading && reading.length > 0 && <NeedsReadingChip categories={reading} />}
          </span>
          <span className="mt-1 block text-[15px] leading-snug">
            <Reasons reasons={[...flag.reasons, ...extraReasons]} />
          </span>
          {note && <span className="mt-1.5 block text-[13px]">{note}</span>}
        </span>
        <ChevronRight aria-hidden size={18} className="mt-1 shrink-0 text-text-muted/60 sm:hidden" />
      </button>

      <div className="flex flex-col items-start gap-1 pl-5 sm:items-end sm:pl-0">
        <StatusControl studentId={student.studentId} level={flag.level} status={status} disabled={!ready} onChange={onStatusChange} />
        {followUp && <span className="text-[12px] text-text-muted">Updated {formatTime(followUp.updatedAt)}</span>}
      </div>
    </li>
  );
}
