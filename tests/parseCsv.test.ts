import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/parseCsv";
import { findStudent, loadDataset } from "./helpers";

const HEADER =
  "student_id,school,class,q1_sleep_well,q2_safe_at_home,q3_bullied,q4_trusted_adult,q5_sad_most_days,q6_thoughts_of_self_harm,q7_wants_counsellor,comment";

describe("parseCsv on the synthetic dataset", () => {
  const { students, report } = loadDataset();

  it("loads all 72 students, each with an ID, school and class (AC-01)", () => {
    expect(students).toHaveLength(72);
    expect(report.total).toBe(72);
    for (const s of students) {
      expect(s.studentId).toMatch(/^S-\d{3}$/);
      expect(s.school).not.toBe("");
      expect(s.className).not.toBe("");
    }
  });

  it("finds 4 schools", () => {
    expect(new Set(students.map((s) => s.school)).size).toBe(4);
  });

  it('S-045: fixes lowercase "often" to "Often" and records the fix', () => {
    const s = findStudent(students, "S-045");
    expect(s.q3Bullied).toBe("Often");
    expect(s.fixes).toHaveLength(1);
    expect(s.dataIssues).toEqual([]); // a fixed answer is not a problem to check
    expect(report.fixed).toEqual([{ studentId: "S-045", field: "bullied", from: "often", to: "Often" }]);
  });

  it("S-010: blank sleep answer becomes null (missing), never a default", () => {
    const s = findStudent(students, "S-010");
    expect(s.q1SleepWell).toBeNull();
    expect(s.dataIssues).toEqual(["Missing answer: sleep"]);
    expect(report.missing).toEqual([{ studentId: "S-010", field: "sleep" }]);
  });

  it("reads 'Prefer not to say' for the 8 students who chose it", () => {
    const ids = students.filter((s) => s.q6SelfHarm === "Prefer not to say").map((s) => s.studentId);
    expect(ids).toEqual(["S-016", "S-027", "S-029", "S-047", "S-051", "S-052", "S-055", "S-058"]);
  });

  it("keeps S-023's comment text", () => {
    expect(findStudent(students, "S-023").comment).toBe("Sometimes I don't want to go home");
  });

  it("matches the Data check summary: 1 missing, 1 fixed, nothing else wrong", () => {
    expect(report.missing).toHaveLength(1);
    expect(report.fixed).toHaveLength(1);
    expect(report.invalid).toHaveLength(0);
    expect(report.duplicates).toHaveLength(0);
    expect(report.problems).toHaveLength(0);
  });

  it("turns empty comments into an empty string", () => {
    expect(findStudent(students, "S-001").comment).toBe("");
  });
});

describe("parseCsv on messy input", () => {
  it("trims spaces and ignores case in every categorical answer", () => {
    const { students, report } = parseCsv(`${HEADER}\n S-900 , School X , VI ,3,3, SOMETIMES , yes ,NO, prefer not to say ,No,  hi  `);
    const s = students[0];
    expect(s.studentId).toBe("S-900");
    expect(s.school).toBe("School X");
    expect(s.q3Bullied).toBe("Sometimes");
    expect(s.q4TrustedAdult).toBe("Yes");
    expect(s.q5SadMostDays).toBe("No");
    expect(s.q6SelfHarm).toBe("Prefer not to say");
    expect(s.comment).toBe("hi");
    expect(report.fixed).toHaveLength(4);
  });

  it("marks out-of-range or non-numeric scale answers as unreadable, not as a value", () => {
    const { students, report } = parseCsv(`${HEADER}\nS-901,School X,VI,7,abc,Never,Yes,No,No,No,`);
    expect(students[0].q1SleepWell).toBeNull();
    expect(students[0].q2SafeAtHome).toBeNull();
    expect(report.invalid).toHaveLength(2);
    expect(students[0].dataIssues[0]).toContain("Unreadable answer: sleep");
  });

  it("marks an unknown categorical answer as unreadable", () => {
    const { students } = parseCsv(`${HEADER}\nS-902,School X,VI,3,3,Maybe,Yes,No,No,No,`);
    expect(students[0].q3Bullied).toBeNull();
    expect(students[0].dataIssues).toEqual(['Unreadable answer: bullied ("Maybe")']);
  });

  it("keeps a row with too few columns and flags it for a manual check (never drops it)", () => {
    const { students, report } = parseCsv(`${HEADER}\nS-903,School X,VI,3\nS-904,School X,VI,3,3,Never,Yes,No,No,No,`);
    expect(students).toHaveLength(2);
    expect(students[0].dataIssues.some((i) => i.startsWith("Data problem: check manually"))).toBe(true);
    expect(students[0].q2SafeAtHome).toBeNull();
    expect(report.problems).toHaveLength(1);
  });

  it("keeps a row with no student ID and gives it a placeholder ID", () => {
    const { students, report } = parseCsv(`${HEADER}\n,School X,VI,3,3,Never,Yes,No,No,No,`);
    expect(students[0].studentId).toBe("UNKNOWN-row-2");
    expect(report.problems[0].message).toContain("no student ID");
  });

  it("keeps both copies of a duplicate student ID and flags both", () => {
    const row = "S-905,School X,VI,3,3,Never,Yes,No,No,No,";
    const { students, report } = parseCsv(`${HEADER}\n${row}\n${row}`);
    expect(students).toHaveLength(2);
    expect(report.duplicates).toEqual(["S-905"]);
    for (const s of students) expect(s.dataIssues).toContain("Data problem: check manually (duplicate student ID)");
  });

  it("handles comments containing commas when quoted", () => {
    const { students } = parseCsv(`${HEADER}\nS-906,School X,VI,3,3,Never,Yes,No,No,No,"Hello, I am fine"`);
    expect(students[0].comment).toBe("Hello, I am fine");
    expect(students[0].dataIssues).toEqual([]);
  });

  it("ignores blank lines at the end of the file", () => {
    const { students } = parseCsv(`${HEADER}\nS-907,School X,VI,3,3,Never,Yes,No,No,No,\n\n\n`);
    expect(students).toHaveLength(1);
  });
});
