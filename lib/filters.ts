// Filtering and search for the counsellor board (AC-06). Pure functions, easy to test.

import type { BoardRow } from "./board";
import { compareClasses } from "./classOrder";
import type { FlagLevel } from "./flags";
import { STATUS_LABELS, type FollowUpStatus } from "./followUps";

/** "none" = students with no follow-up at all (None students nobody has added). */
export type StatusFilter = FollowUpStatus | "none";

export interface Filters {
  school: string | null;
  className: string | null;
  level: FlagLevel | null;
  status: StatusFilter | null;
  search: string; // part of a student ID, e.g. "45", "s-045" or "S045"
}

export const EMPTY_FILTERS: Filters = { school: null, className: null, level: null, status: null, search: "" };

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = { ...STATUS_LABELS, none: "No follow-up" };

// Ignore case, spaces and dashes, so "s045", "S-045" and "045" all find S-045.
const normaliseId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

export function matchesFilters(row: BoardRow, f: Filters): boolean {
  const { student, flag, status } = row;
  if (f.school && student.school !== f.school) return false;
  if (f.className && student.className !== f.className) return false;
  if (f.level && flag.level !== f.level) return false;
  if (f.status && (status ?? "none") !== f.status) return false;
  const search = normaliseId(f.search);
  if (search && !normaliseId(student.studentId).includes(search)) return false;
  return true;
}

export function applyFilters(rows: BoardRow[], f: Filters): BoardRow[] {
  return rows.filter((row) => matchesFilters(row, f));
}

export const hasActiveFilters = (f: Filters) =>
  Boolean(f.school || f.className || f.level || f.status || f.search.trim());

/** Removable chips for the active filters, e.g. "School: School A". */
export function activeFilterChips(f: Filters): { key: keyof Filters; label: string }[] {
  const chips: { key: keyof Filters; label: string }[] = [];
  if (f.school) chips.push({ key: "school", label: `School: ${f.school}` });
  if (f.className) chips.push({ key: "className", label: `Class: ${f.className}` });
  if (f.level) chips.push({ key: "level", label: `Flag: ${f.level}` });
  if (f.status) chips.push({ key: "status", label: `Follow-up: ${STATUS_FILTER_LABELS[f.status]}` });
  if (f.search.trim()) chips.push({ key: "search", label: `ID contains “${f.search.trim()}”` });
  return chips;
}

/** Classes to offer in the class dropdown: only the chosen school's, or every class. */
export function classOptions(rows: BoardRow[], school: string | null): string[] {
  const classes = new Set(rows.filter((r) => !school || r.student.school === school).map((r) => r.student.className));
  return [...classes].sort(compareClasses);
}
