import { describe, expect, it } from "vitest";
import { pendingCheckIns, summarise, type CheckIn, type CheckInResponse } from "@/lib/checkins";
import { checkInReasons, countByLevel, flagStudent } from "@/lib/flags";
import { checkInRateTable } from "@/lib/supervisorSummary";
import { loadDataset } from "./helpers";

const checkIn = (id: string, school: string, className: string | null, at = "2026-11-10T08:00:00Z"): CheckIn => ({ id, school, className, questions: ["feeling", "worry"], createdAt: at });
const response = (checkInId: string, studentId: string, extra: Partial<CheckInResponse> = {}): CheckInResponse => ({
  id: `${checkInId}-${studentId}`,
  checkInId,
  studentId,
  feeling: 3,
  worry: "No",
  comment: "",
  createdAt: "2026-11-10T09:00:00Z",
  ...extra,
});

describe("check-ins (P-04)", () => {
  const all = [checkIn("a", "School A", null), checkIn("b", "School A", "VI"), checkIn("c", "School A", "VII"), checkIn("d", "School B", null)];

  it("a student sees check-ins for their whole school or their class only", () => {
    expect(pendingCheckIns(all, [], "S-001", "School A", "VI").map((c) => c.id).sort()).toEqual(["a", "b"]);
  });

  it("answered check-ins disappear", () => {
    expect(pendingCheckIns(all, [response("a", "S-001")], "S-001", "School A", "VI").map((c) => c.id)).toEqual(["b"]);
  });

  it("summarises answers for the timeline, including skipped questions", () => {
    expect(summarise(response("a", "S-001", { feeling: 2, worry: null, comment: "exams" }))).toBe("Feeling: A bit low · Worried: skipped · “exams”");
  });

  it("'Not good' or worried 'Yes' on the LATEST check-in adds a reason", () => {
    expect(checkInReasons([response("a", "S-001", { feeling: 1 })]).map((r) => r.text)).toEqual(["Check-in: needs follow-up"]);
    expect(checkInReasons([response("a", "S-001", { worry: "Yes" })])).toHaveLength(1);
    expect(checkInReasons([response("a", "S-001")])).toEqual([]);
    // an older worrying answer followed by a fine one: no reason
    expect(checkInReasons([response("a", "S-001", { feeling: 1, createdAt: "2026-11-01" }), response("b", "S-001", { createdAt: "2026-11-09" })])).toEqual([]);
  });

  it("the check-in rule never changes survey flag levels (counts stay 2/17/17/36)", () => {
    const { students } = loadDataset();
    expect(countByLevel(students.map((s) => flagStudent(s)))).toEqual({ Urgent: 2, High: 17, Review: 17, None: 36 });
  });
});

describe("supervisor: check-in response rates only", () => {
  const { students } = loadDataset();
  const people = students.map((s) => ({ studentId: s.studentId, school: s.school, className: s.className }));

  it("counts students who were sent a check-in, and who answered; small numbers hidden", () => {
    const answered = students.filter((s) => s.school === "School A").slice(0, 20).map((s) => s.studentId);
    const table = checkInRateTable(people, [{ school: "School A", className: null }, { school: "School D", className: "XI" }], answered);
    const a = table.find((r) => r.school === "School A")!;
    expect(a.cells.Answered).toEqual({ kind: "count", value: 20 });
    // School D XI has 2 students: the whole row is hidden...
    expect(table.find((r) => r.school === "School D")!.cells.Total).toEqual({ kind: "small" });
    // ...and School A's total (26) is hidden too, otherwise 28 (all schools) − 26 would reveal School D's 2.
    expect(a.cells.Total).toEqual({ kind: "hidden" });
    expect(JSON.stringify(table)).not.toMatch(/S-\d/);
  });
});
