// Builds and sorts the rows of the counsellor board. Pure functions, easy to test.

import { flagStudent, FLAG_LEVELS, type FlagOptions, type FlagResult } from "./flags";
import { currentStatus, FOLLOW_UP_STATUSES, type FollowUp, type FollowUpMap, type FollowUpStatus } from "./followUps";
import type { Student } from "./parseCsv";

export interface BoardRow {
  student: Student;
  flag: FlagResult;
  followUp: FollowUp | undefined;
  status: FollowUpStatus | null; // null = None student with no follow-up added
}

export function buildRows(students: Student[], followUps: FollowUpMap, options: FlagOptions): BoardRow[] {
  const rows = students.map((student) => {
    const flag = flagStudent(student, options);
    const followUp = followUps[student.studentId];
    return { student, flag, followUp, status: currentStatus(flag.level, followUp) };
  });
  return rows.sort(compareRows);
}

// Sort order (section 6.2):
//   1. Flag level: Urgent → High → Review → None
//   2. Within a level: Not started → In progress → Closed (unfinished work first)
//   3. Then by student ID, so the order is stable and predictable
export function compareRows(a: BoardRow, b: BoardRow): number {
  const byLevel = FLAG_LEVELS.indexOf(a.flag.level) - FLAG_LEVELS.indexOf(b.flag.level);
  if (byLevel !== 0) return byLevel;
  const byStatus = statusRank(a.status) - statusRank(b.status);
  if (byStatus !== 0) return byStatus;
  return a.student.studentId.localeCompare(b.student.studentId);
}

// No follow-up at all (None students) sorts after Closed.
const statusRank = (status: FollowUpStatus | null) =>
  status === null ? FOLLOW_UP_STATUSES.length : FOLLOW_UP_STATUSES.indexOf(status);
