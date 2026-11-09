// SERVER ONLY: turns student rows into the supervisor's table of counts.
// Student IDs and answers go in; only suppressed counts come out (AC-05).

import { flagStudent, type FlagOptions } from "./flags";
import type { Student } from "./parseCsv";
import { suppress, type CountRow, type SafeRow } from "./suppression";

export interface SupervisorSummary {
  rows: SafeRow[];
  usesExtraRules: boolean;
}

export const ALL_SCHOOLS = "All schools";

const emptyCounts = () => ({ Urgent: 0, High: 0, Review: 0, None: 0, Total: 0 });

// Class names are Roman numerals (IV … XII), so sort them by value, not alphabetically.
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
export function romanToNumber(roman: string): number {
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const value = ROMAN[roman[i]] ?? NaN;
    const next = ROMAN[roman[i + 1]] ?? 0;
    total += value < next ? -value : value;
  }
  return total;
}
const compareClasses = (a: string, b: string) =>
  romanToNumber(a) - romanToNumber(b) || a.localeCompare(b);

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
