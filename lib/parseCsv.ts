// Turns the raw SA survey CSV into clean, typed Student records.
//
// Principles (why this file exists):
// 1. NEVER silently drop a row. A dropped row is a child the counsellor never sees.
//    Broken rows are kept and marked "Data problem: check manually".
// 2. Missing or invalid answers become `null`, never a default value.
//    A blank sleep answer must not be read as "sleeps fine".
// 3. Harmless spelling/case slips ("often", " Yes ") are fixed, and every fix is
//    recorded so the counsellor can see what the app changed.
// 4. Nothing here logs student data (no console.log), on purpose.

import Papa from "papaparse";

export type Bullied = "Never" | "Sometimes" | "Often";
export type YesNo = "Yes" | "No";
export type SelfHarmAnswer = "Yes" | "No" | "Prefer not to say";

export interface Student {
  studentId: string;
  school: string;
  className: string; // "class" is a reserved word in JS, so we use className
  q1SleepWell: number | null; // 1 (rarely) to 4 (always)
  q2SafeAtHome: number | null; // 1 (never) to 4 (always)
  q3Bullied: Bullied | null;
  q4TrustedAdult: YesNo | null;
  q5SadMostDays: YesNo | null;
  q6SelfHarm: SelfHarmAnswer | null;
  q7WantsCounsellor: YesNo | null;
  comment: string; // "" when the student wrote nothing
  dataIssues: string[]; // things a person should check (missing, invalid, broken row)
  fixes: string[]; // things the app corrected automatically (for transparency)
}

// One entry per problem, so the "Data check" panel can show counts and student IDs.
export interface DataReport {
  total: number;
  missing: { studentId: string; field: string }[];
  invalid: { studentId: string; field: string; value: string }[];
  fixed: { studentId: string; field: string; from: string; to: string }[];
  duplicates: string[]; // student IDs that appear more than once
  problems: { studentId: string; message: string }[]; // unparseable / broken rows
}

export interface ParseResult {
  students: Student[];
  report: DataReport;
}

// Friendly field names, used in messages like "Missing answer: sleep".
const FIELD_LABELS = {
  q1_sleep_well: "sleep",
  q2_safe_at_home: "safe at home",
  q3_bullied: "bullied",
  q4_trusted_adult: "trusted adult",
  q5_sad_most_days: "sad most days",
  q6_thoughts_of_self_harm: "self-harm",
  q7_wants_counsellor: "wants counsellor",
} as const;

type AnswerColumn = keyof typeof FIELD_LABELS;
type RawRow = Record<string, string | undefined>;

const BULLIED_OPTIONS = ["Never", "Sometimes", "Often"] as const;
const YES_NO_OPTIONS = ["Yes", "No"] as const;
const SELF_HARM_OPTIONS = ["Yes", "No", "Prefer not to say"] as const;

// Shared state while parsing one row: where to record problems.
interface RowContext {
  studentId: string;
  dataIssues: string[];
  fixes: string[];
  report: DataReport;
}

function recordMissing(ctx: RowContext, column: AnswerColumn) {
  const field = FIELD_LABELS[column];
  ctx.dataIssues.push(`Missing answer: ${field}`);
  ctx.report.missing.push({ studentId: ctx.studentId, field });
}

function recordInvalid(ctx: RowContext, column: AnswerColumn, value: string) {
  const field = FIELD_LABELS[column];
  ctx.dataIssues.push(`Unreadable answer: ${field} ("${value}")`);
  ctx.report.invalid.push({ studentId: ctx.studentId, field, value });
}

/** Reads a 1–4 scale answer. Blank or out-of-range → null (never a guess). */
function readScale(row: RawRow, column: AnswerColumn, ctx: RowContext): number | null {
  const raw = (row[column] ?? "").trim();
  if (raw === "") {
    recordMissing(ctx, column);
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 4) {
    recordInvalid(ctx, column, raw);
    return null;
  }
  return value;
}

/**
 * Reads a categorical answer, ignoring case and extra spaces.
 * Why: exact matching would turn "often" into "no match" and the student
 * would silently fall to None. S-045 is exactly this case.
 */
function readChoice<T extends string>(
  row: RawRow,
  column: AnswerColumn,
  options: readonly T[],
  ctx: RowContext,
): T | null {
  const original = row[column] ?? "";
  const cleaned = original.trim().replace(/\s+/g, " ");
  if (cleaned === "") {
    recordMissing(ctx, column);
    return null;
  }
  const match = options.find((option) => option.toLowerCase() === cleaned.toLowerCase());
  if (!match) {
    recordInvalid(ctx, column, cleaned);
    return null;
  }
  if (match !== original) {
    const field = FIELD_LABELS[column];
    ctx.fixes.push(`Fixed spelling/case: ${field} "${original}" → "${match}"`);
    ctx.report.fixed.push({ studentId: ctx.studentId, field, from: original, to: match });
  }
  return match;
}

export function parseCsv(csvText: string): ParseResult {
  const report: DataReport = { total: 0, missing: [], invalid: [], fixed: [], duplicates: [], problems: [] };

  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    // Only fully blank lines are skipped: they are not students, just trailing newlines.
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  // Papaparse reports structural problems (too few/many columns) per row index.
  const rowErrors = new Map<number, string>();
  for (const error of parsed.errors) {
    if (typeof error.row === "number") rowErrors.set(error.row, error.message);
  }

  const seenIds = new Map<string, number>();
  const students: Student[] = parsed.data.map((row, index) => {
    const rowNumber = index + 2; // +1 for the header, +1 because spreadsheets count from 1
    const rawId = (row.student_id ?? "").trim();
    const studentId = rawId === "" ? `UNKNOWN-row-${rowNumber}` : rawId;
    const ctx: RowContext = { studentId, dataIssues: [], fixes: [], report };

    const flagProblem = (detail: string) => {
      ctx.dataIssues.push(`Data problem: check manually (${detail})`);
      report.problems.push({ studentId, message: detail });
    };

    if (rawId === "") flagProblem(`row ${rowNumber} has no student ID`);
    const structuralError = rowErrors.get(index);
    if (structuralError) flagProblem(`row ${rowNumber}: ${structuralError}`);

    const school = (row.school ?? "").trim();
    const className = (row.class ?? "").trim();
    if (school === "") flagProblem("school is blank");
    if (className === "") flagProblem("class is blank");

    // Count IDs so duplicates are kept but clearly marked.
    seenIds.set(studentId, (seenIds.get(studentId) ?? 0) + 1);

    return {
      studentId,
      school,
      className,
      q1SleepWell: readScale(row, "q1_sleep_well", ctx),
      q2SafeAtHome: readScale(row, "q2_safe_at_home", ctx),
      q3Bullied: readChoice(row, "q3_bullied", BULLIED_OPTIONS, ctx),
      q4TrustedAdult: readChoice(row, "q4_trusted_adult", YES_NO_OPTIONS, ctx),
      q5SadMostDays: readChoice(row, "q5_sad_most_days", YES_NO_OPTIONS, ctx),
      q6SelfHarm: readChoice(row, "q6_thoughts_of_self_harm", SELF_HARM_OPTIONS, ctx),
      q7WantsCounsellor: readChoice(row, "q7_wants_counsellor", YES_NO_OPTIONS, ctx),
      comment: (row.comment ?? "").trim(),
      dataIssues: ctx.dataIssues,
      fixes: ctx.fixes,
    };
  });

  // Second pass: now that every ID is counted, mark all copies of a duplicate.
  for (const student of students) {
    if ((seenIds.get(student.studentId) ?? 0) > 1) {
      student.dataIssues.push("Data problem: check manually (duplicate student ID)");
      if (!report.duplicates.includes(student.studentId)) report.duplicates.push(student.studentId);
    }
  }

  report.total = students.length;
  return { students, report };
}
