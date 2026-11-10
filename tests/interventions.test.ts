import { describe, expect, it } from "vitest";
import { buildRows } from "@/lib/board";
import { changeStatus } from "@/lib/followUps";
import { caseload, isOverdue, nextFollowUp, overdueUrgentStudents, URGENT_CONTACT_WINDOW_HOURS, type Intervention } from "@/lib/interventions";
import { buildTimeline } from "@/lib/timeline";
import { loadDataset } from "./helpers";

const { students } = loadDataset();
const FLAGGED = new Date("2026-11-01T08:00:00Z");
const HOUR = 60 * 60 * 1000;
const intervention = (studentId: string, at: Date, extra: Partial<Intervention> = {}): Intervention => ({
  id: `${studentId}-${at.toISOString()}`,
  studentId,
  type: "check_in_meeting",
  notes: "",
  outcome: "n/a",
  followUpDate: null,
  createdAt: at.toISOString(),
  ...extra,
});
const rows = buildRows(students, {}, { useExtraRules: true });

describe("overdue urgent safety net (P-01)", () => {
  it(`both Urgent students are overdue once ${URGENT_CONTACT_WINDOW_HOURS} h pass with no contact logged`, () => {
    expect(overdueUrgentStudents(rows, [], FLAGGED, new Date(FLAGGED.getTime() + 25 * HOUR))).toEqual(["S-005", "S-038"]);
  });

  it("nobody is overdue before the window has passed", () => {
    expect(overdueUrgentStudents(rows, [], FLAGGED, new Date(FLAGGED.getTime() + 23 * HOUR))).toEqual([]);
  });

  it("logging any intervention after the flag clears that student", () => {
    const logged = [intervention("S-005", new Date(FLAGGED.getTime() + 2 * HOUR))];
    expect(overdueUrgentStudents(rows, logged, FLAGGED, new Date(FLAGGED.getTime() + 48 * HOUR))).toEqual(["S-038"]);
  });

  it("an intervention from BEFORE the student was flagged doesn't count", () => {
    const old = [intervention("S-005", new Date(FLAGGED.getTime() - 24 * HOUR))];
    expect(overdueUrgentStudents(rows, old, FLAGGED, new Date(FLAGGED.getTime() + 48 * HOUR))).toContain("S-005");
  });

  it("changing the follow-up status alone is not 'contact logged'", () => {
    const withStatus = buildRows(students, { "S-005": changeStatus(undefined, "in_progress") }, { useExtraRules: true });
    expect(overdueUrgentStudents(withStatus, [], FLAGGED, new Date(FLAGGED.getTime() + 48 * HOUR))).toContain("S-005");
  });
});

describe("caseload", () => {
  it("holds only open follow-ups, most urgent first", () => {
    const list = caseload(rows, []);
    expect(list.length).toBe(36); // every flagged student starts "Not started"
    expect(list.slice(0, 2).map((r) => r.student.studentId)).toEqual(["S-005", "S-038"]);
  });

  it("closed follow-ups leave the caseload", () => {
    const closed = buildRows(students, { "S-005": changeStatus(undefined, "closed", "Met") }, { useExtraRules: true });
    expect(caseload(closed, []).map((r) => r.student.studentId)).not.toContain("S-005");
  });

  it("within a level, the earliest (most overdue) follow-up date comes first", () => {
    const list = caseload(rows, [
      intervention("S-002", FLAGGED, { followUpDate: "2026-11-20" }),
      intervention("S-014", FLAGGED, { followUpDate: "2026-11-05" }),
    ]);
    const high = list.filter((r) => r.flag.level === "High").map((r) => r.student.studentId);
    expect(high.slice(0, 2)).toEqual(["S-014", "S-002"]);
  });

  it("the next follow-up date comes from the latest intervention; overdue means before today", () => {
    const list = [intervention("S-002", FLAGGED, { followUpDate: "2026-11-05" }), intervention("S-002", new Date(FLAGGED.getTime() + HOUR), { followUpDate: "2026-11-30" })];
    expect(nextFollowUp("S-002", list)).toBe("2026-11-30");
    expect(isOverdue("2026-11-05", "2026-11-10")).toBe(true);
    expect(isOverdue("2026-11-30", "2026-11-10")).toBe(false);
    expect(isOverdue(null, "2026-11-10")).toBe(false);
  });
});

describe("timeline", () => {
  it("merges status changes, interventions and messages, newest first, with no message content", () => {
    const followUp = changeStatus(undefined, "in_progress", "", new Date("2026-11-02T09:00:00Z"));
    const t = buildTimeline({
      followUp,
      interventions: [intervention("S-005", new Date("2026-11-03T09:00:00Z"), { notes: "Spoke at lunch" })],
      messages: [{ createdAt: "2026-11-04T09:00:00Z", sender: "student" }],
    });
    expect(t.map((e) => e.kind)).toEqual(["message", "intervention", "status"]);
    expect(t[0]).toEqual({ at: "2026-11-04T09:00:00Z", kind: "message", title: "Student sent a message" });
    expect(t[1].detail).toContain("Spoke at lunch");
  });
});
