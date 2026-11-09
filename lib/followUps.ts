// Follow-up tracking (AC-04): pure types and helpers, no storage.
// Storage lives in lib/followUpStore.ts (demo: localStorage; live: Supabase).

import type { FlagLevel } from "./flags";

export type FollowUpStatus = "not_started" | "in_progress" | "closed";

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ["not_started", "in_progress", "closed"];

export const STATUS_LABELS: Record<FollowUpStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  closed: "Closed",
};

// One line in the audit trail. "Track every follow-up" is a CECD goal,
// so we keep every change, not just the latest status.
export interface FollowUpEvent {
  from: FollowUpStatus | null; // null = follow-up was just created
  to: FollowUpStatus;
  note: string;
  at: string; // ISO timestamp
}

export interface FollowUp {
  status: FollowUpStatus;
  note: string; // the counsellor's private note
  updatedAt: string; // ISO timestamp
  history: FollowUpEvent[];
}

export type FollowUpMap = Record<string, FollowUp>;

/** Every flagged student needs a follow-up. None students only if the counsellor adds one. */
export const needsFollowUp = (level: FlagLevel) => level !== "None";

/** The status to show: the saved one, or "Not started" for a flagged student with nothing saved yet. */
export function currentStatus(level: FlagLevel, followUp: FollowUp | undefined): FollowUpStatus | null {
  if (followUp) return followUp.status;
  return needsFollowUp(level) ? "not_started" : null;
}

// Closing an Urgent case must never be a single accidental click,
// so it needs a short note saying what was done.
export const MIN_CLOSING_NOTE_LENGTH = 5;

export function closingNeedsNote(level: FlagLevel, to: FollowUpStatus): boolean {
  return level === "Urgent" && to === "closed";
}

export function isValidClosingNote(note: string): boolean {
  return note.trim().length >= MIN_CLOSING_NOTE_LENGTH;
}

/** Returns a NEW follow-up with the status changed and the change added to the history. */
export function changeStatus(
  previous: FollowUp | undefined,
  to: FollowUpStatus,
  eventNote = "",
  now = new Date(),
): FollowUp {
  const at = now.toISOString();
  return {
    status: to,
    note: previous?.note ?? "",
    updatedAt: at,
    history: [...(previous?.history ?? []), { from: previous?.status ?? null, to, note: eventNote.trim(), at }],
  };
}

/** Returns a NEW follow-up with only the private note changed. */
export function changeNote(previous: FollowUp | undefined, note: string, now = new Date()): FollowUp {
  return {
    status: previous?.status ?? "not_started",
    note: note.trim(),
    updatedAt: now.toISOString(),
    history: previous?.history ?? [],
  };
}
