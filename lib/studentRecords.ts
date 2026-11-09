// Converts between parsed students (lib/parseCsv.ts) and rows in the Supabase `students` table.
// The seed script writes with toDbRows(); live mode reads with fromDbRows(). Both run the SAME
// parser output, so demo and live mode show identical flags and data checks.

import type { DataReport, ParseResult, Student } from "./parseCsv";

/** This student's share of the Data check report, stored so live mode can rebuild the panel. */
export interface StudentDataCheck {
  missing?: DataReport["missing"];
  invalid?: DataReport["invalid"];
  fixed?: DataReport["fixed"];
  problems?: DataReport["problems"];
}

export interface StudentDbRow {
  student_id: string;
  school: string;
  class: string;
  q1_sleep_well: number | null;
  q2_safe_at_home: number | null;
  q3_bullied: Student["q3Bullied"];
  q4_trusted_adult: Student["q4TrustedAdult"];
  q5_sad_most_days: Student["q5SadMostDays"];
  q6_thoughts_of_self_harm: Student["q6SelfHarm"];
  q7_wants_counsellor: Student["q7WantsCounsellor"];
  comment: string;
  data_issues: string[];
  fixes: string[];
  data_check: StudentDataCheck;
}

export function toDbRows({ students, report }: ParseResult): StudentDbRow[] {
  const forStudent = <T extends { studentId: string }>(items: T[], id: string) =>
    items.filter((item) => item.studentId === id);

  return students.map((s) => {
    const check: StudentDataCheck = {};
    const missing = forStudent(report.missing, s.studentId);
    const invalid = forStudent(report.invalid, s.studentId);
    const fixed = forStudent(report.fixed, s.studentId);
    const problems = forStudent(report.problems, s.studentId);
    if (missing.length) check.missing = missing;
    if (invalid.length) check.invalid = invalid;
    if (fixed.length) check.fixed = fixed;
    if (problems.length) check.problems = problems;

    return {
      student_id: s.studentId,
      school: s.school,
      class: s.className,
      q1_sleep_well: s.q1SleepWell,
      q2_safe_at_home: s.q2SafeAtHome,
      q3_bullied: s.q3Bullied,
      q4_trusted_adult: s.q4TrustedAdult,
      q5_sad_most_days: s.q5SadMostDays,
      q6_thoughts_of_self_harm: s.q6SelfHarm,
      q7_wants_counsellor: s.q7WantsCounsellor,
      comment: s.comment,
      data_issues: s.dataIssues,
      fixes: s.fixes,
      data_check: check,
    };
  });
}

/** Rebuilds students and the Data check report from the rows this user is allowed to see. */
export function fromDbRows(rows: StudentDbRow[]): ParseResult {
  const sorted = [...rows].sort((a, b) => a.student_id.localeCompare(b.student_id));
  const report: DataReport = { total: sorted.length, missing: [], invalid: [], fixed: [], duplicates: [], problems: [] };

  const students: Student[] = sorted.map((r) => {
    report.missing.push(...(r.data_check.missing ?? []));
    report.invalid.push(...(r.data_check.invalid ?? []));
    report.fixed.push(...(r.data_check.fixed ?? []));
    report.problems.push(...(r.data_check.problems ?? []));
    return {
      studentId: r.student_id,
      school: r.school,
      className: r.class,
      q1SleepWell: r.q1_sleep_well,
      q2SafeAtHome: r.q2_safe_at_home,
      q3Bullied: r.q3_bullied,
      q4TrustedAdult: r.q4_trusted_adult,
      q5SadMostDays: r.q5_sad_most_days,
      q6SelfHarm: r.q6_thoughts_of_self_harm,
      q7WantsCounsellor: r.q7_wants_counsellor,
      comment: r.comment,
      dataIssues: r.data_issues,
      fixes: r.fixes,
    };
  });
  return { students, report };
}
