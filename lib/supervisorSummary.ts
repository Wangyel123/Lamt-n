// SERVER ONLY: turns student rows into the supervisor's table of counts.
// Student IDs and answers go in; only suppressed counts come out (AC-05).

import { compareClasses } from "./classOrder";
import { flagStudent, type FlagOptions } from "./flags";
import type { Student } from "./parseCsv";
import { INTERVENTION_TYPES, type InterventionType } from "./interventions";
import { MIN_GROUP_SIZE, suppress, suppressTable, type CountRow, type SafeCell, type SafeRow, type SafeTableRow, type TableRow } from "./suppression";

export interface SupervisorSummary {
  rows: SafeRow[];
  usesExtraRules: boolean;
}

export const ALL_SCHOOLS = "All schools";

const emptyCounts = () => ({ Urgent: 0, High: 0, Review: 0, None: 0, Total: 0 });

/** Raw counts: one row per class, one per school, one for all schools. Never sent to the browser. */
export function countRows(students: Student[], options: FlagOptions): CountRow[] {
  const bySchool = new Map<string, Map<string, CountRow["counts"]>>();
  for (const s of students) {
    const level = flagStudent(s, options).level;
    const classes = bySchool.get(s.school) ?? new Map();
    bySchool.set(s.school, classes);
    const counts = classes.get(s.className) ?? emptyCounts();
    classes.set(s.className, counts);
    counts[level] += 1;
    counts.Total += 1;
  }

  const rows: CountRow[] = [];
  const all = emptyCounts();
  for (const school of [...bySchool.keys()].sort()) {
    const classes = bySchool.get(school)!;
    const schoolCounts = emptyCounts();
    for (const className of [...classes.keys()].sort(compareClasses)) {
      const counts = classes.get(className)!;
      rows.push({ kind: "class", school, className, counts });
      for (const key of Object.keys(schoolCounts) as (keyof typeof schoolCounts)[]) {
        schoolCounts[key] += counts[key];
        all[key] += counts[key];
      }
    }
    rows.push({ kind: "school", school, className: null, counts: schoolCounts });
  }
  rows.push({ kind: "all", school: ALL_SCHOOLS, className: null, counts: all });
  return rows;
}

/** The ONLY thing the supervisor view and API return: suppressed counts, no IDs, no answers. */
export function buildSupervisorSummary(
  students: Student[],
  options: FlagOptions = { useExtraRules: true },
): SupervisorSummary {
  return { rows: suppress(countRows(students, options)), usesExtraRules: options.useExtraRules };
}

/**
 * "How many students in this row need follow-up?" = students − students with no concerns.
 * Worked out ONLY from numbers the page already shows (Total and None), so it reveals nothing
 * new. If either number is hidden, this is hidden too; a result from 1 to 4 shows as small.
 */
export function followUpCell(row: SafeRow): SafeCell {
  const total = row.cells.Total;
  const none = row.cells.None;
  if (total.kind !== "count" || none.kind !== "count") return { kind: "hidden" };
  const value = total.value - none.value;
  return value > 0 && value < MIN_GROUP_SIZE ? { kind: "small" } : { kind: "count", value };
}

// ---------------------------------------------------------------------------
// P-01: support given, by school. Counts of interventions by type, never notes, never IDs.
// Uses the SAME suppression rules as the flag table.
// ---------------------------------------------------------------------------
export const INTERVENTION_TYPE_KEYS = Object.keys(INTERVENTION_TYPES) as InterventionType[];

export function interventionTable(
  students: { studentId: string; school: string }[],
  interventions: { studentId: string; type: InterventionType }[],
): SafeTableRow<InterventionType>[] {
  const schoolOf = new Map(students.map((s) => [s.studentId, s.school]));
  const empty = () => Object.fromEntries([...INTERVENTION_TYPE_KEYS, "Total"].map((k) => [k, 0])) as Record<InterventionType | "Total", number>;
  const bySchool = new Map<string, Record<InterventionType | "Total", number>>();
  for (const school of new Set(students.map((s) => s.school))) bySchool.set(school, empty());
  const all = empty();
  for (const i of interventions) {
    const school = schoolOf.get(i.studentId);
    if (!school) continue;
    for (const counts of [bySchool.get(school)!, all]) {
      counts[i.type] += 1;
      counts.Total += 1;
    }
  }
  const rows: TableRow<InterventionType>[] = [...bySchool.keys()].sort().map((school) => ({ kind: "school", school, className: null, counts: bySchool.get(school)! }));
  rows.push({ kind: "all", school: ALL_SCHOOLS, className: null, counts: all });
  return suppressTable(rows, INTERVENTION_TYPE_KEYS);
}
