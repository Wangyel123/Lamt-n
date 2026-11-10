"use client";

import { ChevronRight, CircleAlert } from "lucide-react";
import type { BoardRow } from "@/lib/board";
import type { Reason } from "@/lib/flags";
import { formatTime } from "@/lib/format";
import type { FollowUpStatus } from "@/lib/followUps";
import { LevelIcon } from "./FlagBadge";
import { NeedsReadingChip } from "./NeedsReading";
import { Reasons } from "./Reasons";
import { StatusControl } from "./StatusControl";

interface Props {
  row: BoardRow;
  ready: boolean;
  onOpen: () => void;
  onStatusChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>;
  note?: React.ReactNode; // extra line under the reasons (e.g. the next check-in date in My caseload)
  reading?: string[]; // P-02: unread "Needs reading" categories for this student
  extraReasons?: Reason[]; // P-04: e.g. "Check-in: needs follow-up" (never changes the level)
}

// One student as a row in a grouped list (Apple style). Left: who and why. Right: your follow-up.
// Tap the left part for full details. Urgent rows also get a red edge (never colour alone:
// the section heading, icon and word "Urgent" say it too).
export function StudentRow({ row, ready, onOpen, onStatusChange, note, reading, extraReasons = [] }: Props) {
  const { student, flag, followUp, status } = row;

  return (
    <li className="relative flex flex-col gap-2 py-3 pr-4 pl-4 sm:flex-row sm:items-center sm:gap-4">
      {flag.level === "Urgent" && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-urgent" />}

      <button type="button" onClick={onOpen} className="flex min-h-11 flex-1 items-start gap-3 rounded-xl text-left">
        <LevelIcon level={flag.level} />
        <span className="min-w-0 flex-1">
          <span className="sr-only">Open details for </span>
          <span className="tabular font-semibold">{student.studentId}</span>
          <span className="text-text-muted">
            {" "}
            · {student.school} · Class {student.className}
          </span>
          {flag.needsCheck && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 align-middle text-[12px] font-medium text-text-muted">
              <CircleAlert aria-hidden size={12} /> Answer missing
            </span>
          )}
          {reading && reading.length > 0 && <NeedsReadingChip categories={reading} />}
          <span className="mt-0.5 block text-[15px] leading-snug">
            <Reasons reasons={[...flag.reasons, ...extraReasons]} />
          </span>
          {note && <span className="mt-1 block text-[13px]">{note}</span>}
        </span>
        <ChevronRight aria-hidden size={18} className="mt-2.5 shrink-0 text-border sm:hidden" />
      </button>

      <div className="flex flex-col items-start gap-1 pl-12 sm:items-end sm:pl-0">
        <StatusControl studentId={student.studentId} level={flag.level} status={status} disabled={!ready} onChange={onStatusChange} />
        {followUp && <span className="text-[12px] text-text-muted">Updated {formatTime(followUp.updatedAt)}</span>}
      </div>
    </li>
  );
}
