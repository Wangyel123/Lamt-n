import { describe, expect, it } from "vitest";
import { fromDbRows, toDbRows } from "@/lib/studentRecords";
import { loadDataset } from "./helpers";

const parsed = loadDataset();

describe("database rows ⇄ students (live mode uses the same data as demo mode)", () => {
  it("round-trips all 72 students and the Data check report exactly", () => {
    expect(fromDbRows(toDbRows(parsed))).toEqual(parsed);
  });

  it("keeps missing answers as null in the database (never a default)", () => {
    const s010 = toDbRows(parsed).find((r) => r.student_id === "S-010")!;
    expect(s010.q1_sleep_well).toBeNull();
    expect(s010.data_check.missing).toEqual([{ studentId: "S-010", field: "sleep" }]);
  });

  it("stores the fixed value, not the raw typo", () => {
    const s045 = toDbRows(parsed).find((r) => r.student_id === "S-045")!;
    expect(s045.q3_bullied).toBe("Often");
    expect(s045.data_check.fixed).toHaveLength(1);
  });

  it("a counsellor who can see only some rows gets a Data check report for those rows only", () => {
    const schoolB = toDbRows(parsed).filter((r) => r.school === "School B");
    const { report } = fromDbRows(schoolB);
    expect(report.total).toBe(23);
    expect(report.missing).toEqual([]); // S-010 is in School A
    expect(report.fixed.map((f) => f.studentId)).toEqual(["S-045"]);
  });
});
