// P-01: interventions (what a counsellor did for a student) and the caseload. Pure functions.

import type { BoardRow } from "./board";
import { FLAG_LEVELS } from "./flags";

export type InterventionType = "check_in_meeting" | "group_session" | "parent_contact" | "referral_external" | "classroom_support" | "other";
export type InterventionOutcome = "improved" | "no_change" | "concern_increased" | "n/a";

export const INTERVENTION_TYPES: Record<InterventionType, string> = {
  check_in_meeting: "Met with the student",
  group_session: "Group session",
  parent_contact: "Contacted a parent or guardian",
  referral_external: "Referred to outside help",
  classroom_support: "Support in class",
  other: "Other",
};

export const OUTCOMES: Record<InterventionOutcome, string> = {
  improved: "Things seem better",
  no_change: "No change yet",
  concern_increased: "More worried now",
  "n/a": "Too early to say",
};

export interface Intervention {
  id: string;
  studentId: string;
  type: InterventionType;
  notes: string; // counsellor-only; never shown to supervisors or students
  outcome: InterventionOutcome;
  followUpDate: string | null; // "YYYY-MM-DD": when to check in next
  createdAt: string;
}

/**
 * Urgent safety net: an Urgent student with NO intervention logged within this many hours of
 * being flagged shows "Overdue: urgent, no contact logged" at the top of the board.
 */
export const URGENT_CONTACT_WINDOW_HOURS = 24;

/** Demo mode has no import date, so it pretends the survey was loaded on this date (shows the safety net working). */
export const DEMO_SURVEY_LOADED_AT = "2026-11-02T08:00:00.000Z";

/** IDs of Urgent students with no contact logged since they were flagged, once the window has passed. */
export function overdueUrgentStudents(rows: BoardRow[], interventions: Intervention[], flaggedSince: Date, now = new Date()): string[] {
  const windowPassed = now.getTime() - flaggedSince.getTime() > URGENT_CONTACT_WINDOW_HOURS * 60 * 60 * 1000;
  if (!windowPassed) return [];
  return rows
    .filter((r) => r.flag.level === "Urgent")
    .filter((r) => !interventions.some((i) => i.studentId === r.student.studentId && new Date(i.createdAt) >= flaggedSince))
    .map((r) => r.student.studentId);
}

/** The next follow-up date a counsellor set for a student (from their latest intervention), if any. */
export function nextFollowUp(studentId: string, interventions: Intervention[]): string | null {
  const latest = interventions
    .filter((i) => i.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.followUpDate ?? null;
}

export const isOverdue = (date: string | null, today = new Date().toISOString().slice(0, 10)) => date !== null && date < today;

/**
 * My caseload: students with an open follow-up (not closed), most urgent first, then the most
 * overdue follow-up date first, then by ID.
 */
export function caseload(rows: BoardRow[], interventions: Intervention[]): BoardRow[] {
  const open = rows.filter((r) => r.status === "not_started" || r.status === "in_progress");
  const next = (r: BoardRow) => nextFollowUp(r.student.studentId, interventions) ?? "9999-12-31";
  return open.sort(
    (a, b) =>
      FLAG_LEVELS.indexOf(a.flag.level) - FLAG_LEVELS.indexOf(b.flag.level) ||
      next(a).localeCompare(next(b)) ||
      a.student.studentId.localeCompare(b.student.studentId),
  );
}
