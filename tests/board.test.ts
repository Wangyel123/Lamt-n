import { describe, expect, it } from "vitest";
import { buildRows } from "@/lib/board";
import {
  changeNote,
  changeStatus,
  closingNeedsNote,
  currentStatus,
  isValidClosingNote,
  type FollowUpMap,
} from "@/lib/followUps";
import { loadDataset, makeStudent } from "./helpers";

const { students } = loadDataset();
const NOW = new Date("2026-11-09T09:00:00Z");

describe("board order (AC-03)", () => {
  it("puts both Urgent students first", () => {
    const rows = buildRows(students, {}, { useExtraRules: true });
    expect(rows.slice(0, 2).map((r) => r.student.studentId)).toEqual(["S-005", "S-038"]);
  });

  it("orders levels Urgent → High → Review → None, never going back up", () => {
    const order = ["Urgent", "High", "Review", "None"];
    const rows = buildRows(students, {}, { useExtraRules: true });
    const ranks = rows.map((r) => order.indexOf(r.flag.level));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("shows every student exactly once (AC-01)", () => {
    const rows = buildRows(students, {}, { useExtraRules: true });
    expect(new Set(rows.map((r) => r.student.studentId)).size).toBe(72);
  });

  it("within a level: Not started, then In progress, then Closed, then by ID", () => {
    const a = makeStudent({ studentId: "T-1", q3Bullied: "Often" });
    const b = makeStudent({ studentId: "T-2", q3Bullied: "Often" });
    const c = makeStudent({ studentId: "T-3", q3Bullied: "Often" });
    const d = makeStudent({ studentId: "T-4", q3Bullied: "Often" });
    const followUps: FollowUpMap = {
      "T-1": changeStatus(undefined, "closed", "", NOW),
      "T-2": changeStatus(undefined, "in_progress", "", NOW),
    };
    const rows = buildRows([a, b, c, d], followUps, { useExtraRules: true });
    expect(rows.map((r) => r.student.studentId)).toEqual(["T-3", "T-4", "T-2", "T-1"]);
  });

  it("a closed Urgent case still sorts above every High student", () => {
    const urgent = makeStudent({ studentId: "T-9", q6SelfHarm: "Yes" });
    const high = makeStudent({ studentId: "T-1", q3Bullied: "Often" });
    const rows = buildRows([high, urgent], { "T-9": changeStatus(undefined, "closed", "Met", NOW) }, { useExtraRules: true });
    expect(rows[0].student.studentId).toBe("T-9");
  });
});

describe("follow-up status (AC-04)", () => {
  it("flagged students default to Not started; None students have no follow-up", () => {
    expect(currentStatus("High", undefined)).toBe("not_started");
    expect(currentStatus("None", undefined)).toBeNull();
  });

  it("a None student can still get a follow-up if the counsellor adds one", () => {
    expect(currentStatus("None", changeStatus(undefined, "not_started", "", NOW))).toBe("not_started");
  });

  it("changing status records every change in the history", () => {
    const first = changeStatus(undefined, "in_progress", "", NOW);
    const second = changeStatus(first, "closed", "Met and agreed weekly check-ins", NOW);
    expect(second.status).toBe("closed");
    expect(second.history).toEqual([
      { from: null, to: "in_progress", note: "", at: NOW.toISOString() },
      { from: "in_progress", to: "closed", note: "Met and agreed weekly check-ins", at: NOW.toISOString() },
    ]);
    expect(first.history).toHaveLength(1); // the old object is not changed
  });

  it("changing the private note keeps status and history", () => {
    const fu = changeNote(changeStatus(undefined, "in_progress", "", NOW), "  Call parent  ", NOW);
    expect(fu.status).toBe("in_progress");
    expect(fu.note).toBe("Call parent");
    expect(fu.history).toHaveLength(1);
  });

  it("only closing an Urgent case needs a note", () => {
    expect(closingNeedsNote("Urgent", "closed")).toBe(true);
    expect(closingNeedsNote("Urgent", "in_progress")).toBe(false);
    expect(closingNeedsNote("High", "closed")).toBe(false);
  });

  it("a closing note must say something (not blank or a single letter)", () => {
    expect(isValidClosingNote("")).toBe(false);
    expect(isValidClosingNote("   ok  ")).toBe(false);
    expect(isValidClosingNote("Met, referred to health worker")).toBe(true);
  });
});
