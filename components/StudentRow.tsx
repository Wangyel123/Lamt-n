"use client";

import { ChevronRight, CircleAlert } from "lucide-react";
import type { BoardRow } from "@/lib/board";
import { formatTime } from "@/lib/format";
import type { FollowUpStatus } from "@/lib/followUps";
import { FlagBadge, LEVEL_STYLE } from "./FlagBadge";
import { Reasons } from "./Reasons";
import { StatusControl } from "./StatusControl";

interface Props {
  row: BoardRow;
  ready: boolean;
  onOpen: () => void;
  onStatusChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>;
}

// One student as a card. Cards (not a wide table) work at every screen width.
// Urgent cards use several cues at once so they are noticed without reading:
// top position + tinted background + thick left border + icon + bold "URGENT" label.
export function StudentRow({ row, ready, onOpen, onStatusChange }: Props) {
  const { student, flag, followUp, status } = row;
  const isUrgent = flag.level === "Urgent";
  const style = LEVEL_STYLE[flag.level];

  return (
    <li
      className={`rounded-lg border p-4 ${
        isUrgent ? `border-l-[6px] ${style.border} ${style.tint}` : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <FlagBadge level={flag.level} />
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-11 items-center gap-1 rounded-md text-left font-bold underline-offset-2 hover:underline"
          aria-label={`Open details for ${student.studentId}`}
        >
          <span className="tabular">{student.studentId}</span>
          <ChevronRight aria-hidden size={18} className="text-text-muted" />
        </button>
        <span className="text-text-muted">
          {student.school} · Class {student.className}
        </span>
        {flag.needsCheck && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-text-muted px-2 py-0.5 text-sm"
            title={student.dataIssues.join("; ")}
          >
            <CircleAlert aria-hidden size={14} />
            Needs check
            <span className="sr-only">: {student.dataIssues.join("; ")}</span>
          </span>
        )}
      </div>

      <div className="mt-2">
        <Reasons reasons={flag.reasons} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <StatusControl
          studentId={student.studentId}
          level={flag.level}
          status={status}
          disabled={!ready}
          onChange={onStatusChange}
        />
        {followUp && <span className="text-sm text-text-muted">Updated {formatTime(followUp.updatedAt)}</span>}
      </div>
    </li>
  );
}
