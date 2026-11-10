// P-04: short check-ins between surveys. Pure functions and a small, pre-approved question bank.
// TODO(review by CECD counsellor): question wording and answer labels.

export type QuestionId = "feeling" | "worry" | "comment";
export type Feeling = 1 | 2 | 3 | 4;
export type Worry = "Yes" | "No" | "Prefer not to say";

export const QUESTION_BANK: Record<QuestionId, { text: string; optional?: boolean }> = {
  feeling: { text: "How are you feeling this week?" },
  worry: { text: "Is anything worrying you?" },
  comment: { text: "Is there anything you'd like to tell your counsellor?", optional: true },
};
export const FEELING_LABELS: Record<Feeling, string> = { 1: "Not good", 2: "A bit low", 3: "Okay", 4: "Good" };
export const WORRY_OPTIONS: Worry[] = ["Yes", "No", "Prefer not to say"];

export interface CheckIn {
  id: string;
  school: string;
  className: string | null; // null = the whole school
  questions: QuestionId[];
  createdAt: string;
}

export interface CheckInResponse {
  id: string;
  checkInId: string;
  studentId: string;
  feeling: Feeling | null; // null = skipped
  worry: Worry | null;
  comment: string;
  createdAt: string;
}

export const isForGroup = (c: CheckIn, school: string, className: string) => c.school === school && (c.className === null || c.className === className);

/** Check-ins sent to this student's group that they haven't answered yet, newest first. */
export function pendingCheckIns(checkIns: CheckIn[], responses: CheckInResponse[], studentId: string, school: string, className: string): CheckIn[] {
  const answered = new Set(responses.filter((r) => r.studentId === studentId).map((r) => r.checkInId));
  return checkIns.filter((c) => isForGroup(c, school, className) && !answered.has(c.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** One line for the counsellor's timeline, e.g. "Feeling: A bit low · Worried: Yes". */
export function summarise(r: CheckInResponse): string {
  const parts = [
    r.feeling ? `Feeling: ${FEELING_LABELS[r.feeling]}` : "Feeling: skipped",
    r.worry ? `Worried: ${r.worry}` : "Worried: skipped",
  ];
  if (r.comment) parts.push(`“${r.comment}”`);
  return parts.join(" · ");
}
