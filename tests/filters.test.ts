import { describe, expect, it } from "vitest";
import { buildRows } from "@/lib/board";
import { activeFilterChips, applyFilters, classOptions, EMPTY_FILTERS, hasActiveFilters, type Filters } from "@/lib/filters";
import { changeStatus } from "@/lib/followUps";
import { loadDataset } from "./helpers";

const { students } = loadDataset();
const rows = buildRows(students, {}, { useExtraRules: true });
const ids = (f: Partial<Filters>) => applyFilters(rows, { ...EMPTY_FILTERS, ...f }).map((r) => r.student.studentId);

describe("filters (AC-06)", () => {
  it("no filters → all 72 students", () => {
    expect(ids({})).toHaveLength(72);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("by school", () => {
    expect(ids({ school: "School D" })).toEqual(["S-068", "S-070", "S-071", "S-065", "S-066", "S-067", "S-069", "S-072"]);
  });

  it("by class: XI exists in two schools, so school + class narrows it", () => {
    expect(ids({ className: "XI" })).toHaveLength(6);
    expect(ids({ school: "School D", className: "XI" }).sort()).toEqual(["S-071", "S-072"]);
  });

  it("by flag level", () => {
    expect(ids({ level: "Urgent" })).toEqual(["S-005", "S-038"]);
    expect(ids({ level: "High" })).toHaveLength(17);
  });

  it("by follow-up status, including 'No follow-up' for None students", () => {
    const withFollowUps = buildRows(students, { "S-001": changeStatus(undefined, "in_progress") }, { useExtraRules: true });
    const f = (status: Filters["status"]) => applyFilters(withFollowUps, { ...EMPTY_FILTERS, status }).length;
    expect(f("in_progress")).toBe(1);
    expect(f("not_started")).toBe(35); // 36 flagged − S-001
    expect(f("none")).toBe(36);
  });

  it("search by ID ignores case, dashes and spaces", () => {
    expect(ids({ search: "S-045" })).toEqual(["S-045"]);
    expect(ids({ search: "s045" })).toEqual(["S-045"]);
    expect(ids({ search: " 045 " })).toEqual(["S-045"]);
    expect(ids({ search: "04" }).length).toBe(11); // S-004 and S-040 … S-049
    expect(ids({ search: "zzz" })).toEqual([]);
  });

  it("combines filters (AND)", () => {
    expect(ids({ school: "School A", level: "Urgent" })).toEqual(["S-005"]);
    expect(ids({ school: "School C", level: "Urgent" })).toEqual([]);
  });

  it("keeps the board's sort order", () => {
    expect(ids({ school: "School B" }).slice(0, 1)).toEqual(["S-038"]);
  });

  it("makes a removable chip for each active filter", () => {
    const chips = activeFilterChips({ ...EMPTY_FILTERS, school: "School A", level: "High", status: "none", search: "01" });
    expect(chips.map((c) => c.label)).toEqual([
      "School: School A",
      "Flag: High",
      "Follow-up: No follow-up",
      "ID contains “01”",
    ]);
  });

  it("offers only the chosen school's classes", () => {
    expect(classOptions(rows, "School D")).toEqual(["XI", "XII"]);
    expect(classOptions(rows, null)).toEqual(["IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]);
    expect(classOptions(rows, null)).toHaveLength(9); // XI appears in two schools
  });
});
