import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/supervisor/summary/route";
import { COLUMNS, LEVEL_COLUMNS, MIN_GROUP_SIZE, suppress, type CountRow, type SafeCell, type SafeRow } from "@/lib/suppression";
import { romanToNumber } from "@/lib/classOrder";
import { heatCell, percent } from "@/lib/heatmap";
import { buildSupervisorSummary, countRows, followUpCell, interventionTable } from "@/lib/supervisorSummary";
import { loadDataset } from "./helpers";

const { students } = loadDataset();
const summaries = {
  extras: buildSupervisorSummary(students, { useExtraRules: true }),
  baseline: buildSupervisorSummary(students, { useExtraRules: false }),
};
const row = (rows: SafeRow[], school: string, className: string | null) =>
  rows.find((r) => r.school === school && r.className === className)!;

// ---------------------------------------------------------------------------
// Independent audit: plays the attacker. For each line of the table that must add up,
// it tries EVERY combination of values the hidden cells could have and checks that each
// hidden cell still has at least two possible values. Written separately from
// lib/suppression.ts on purpose, so a bug there can't hide itself.
// ---------------------------------------------------------------------------
const MAX = 72; // no count can exceed the number of students

function publicValues(cell: SafeCell, rowIsSmallGroup: boolean, isTotal: boolean): number[] {
  if (cell.kind === "count") return [cell.value];
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (cell.kind === "small") return rowIsSmallGroup && !isTotal ? range(0, 4) : range(1, 4);
  // "hidden": an attacker knows it is not 1–4 (those show "<5"), so 0 or 5+
  return [0, ...range(MIN_GROUP_SIZE, MAX)];
}

function auditLine(cells: { cell: SafeCell; values: number[] }[], wholeIndex: number): string[] {
  const hidden = cells.map((c, i) => i).filter((i) => cells[i].cell.kind !== "count");
  if (hidden.length === 0) return [];
  const seen = hidden.map(() => new Set<number>());
  const assignment = cells.map((c) => c.values[0]);
  // Try every combination of the hidden cells and keep those where the line adds up.
  const visit = (k: number) => {
    if (k === hidden.length) {
      const parts = assignment.reduce((s, v, i) => (i === wholeIndex ? s : s + v), 0);
      if (parts === assignment[wholeIndex]) hidden.forEach((h, j) => seen[j].add(assignment[h]));
      return;
    }
    for (const v of cells[hidden[k]].values) {
      assignment[hidden[k]] = v;
      visit(k + 1);
    }
  };
  visit(0);
  // Exposed = only one possible value, and it isn't 0 (a 0 identifies nobody, which is
  // why zeros are shown openly in the table too).
  const exposed = (j: number) => seen[j].size < 2 && !seen[j].has(0);
  return hidden.filter((_, j) => exposed(j)).map((h) => `cell ${h} has only ${[...seen[hidden.indexOf(h)]]}`);
}

function auditTable(rows: SafeRow[]): string[] {
  const problems: string[] = [];
  const isSmall = (r: SafeRow) => r.cells.Total.kind === "small";
  const pub = (r: SafeRow, col: (typeof COLUMNS)[number]) => ({
    cell: r.cells[col],
    values: publicValues(r.cells[col], isSmall(r), col === "Total"),
  });
  for (const r of rows) {
    const cells = [...LEVEL_COLUMNS.map((c) => pub(r, c)), pub(r, "Total")];
    for (const p of auditLine(cells, 4)) problems.push(`row ${r.school} ${r.className}: ${p}`);
  }
  for (const s of rows.filter((r) => r.kind === "school")) {
    const classes = rows.filter((r) => r.kind === "class" && r.school === s.school);
    for (const col of COLUMNS) {
      const cells = [...classes.map((c) => pub(c, col)), pub(s, col)];
      for (const p of auditLine(cells, cells.length - 1)) problems.push(`${s.school} column ${col}: ${p}`);
    }
  }
  const all = rows.find((r) => r.kind === "all")!;
  const schools = rows.filter((r) => r.kind === "school");
  for (const col of COLUMNS) {
    const cells = [...schools.map((c) => pub(c, col)), pub(all, col)];
    for (const p of auditLine(cells, cells.length - 1)) problems.push(`All schools column ${col}: ${p}`);
  }
  return problems;
}

describe.each(Object.entries(summaries))("supervisor summary (%s rules)", (_name, summary) => {
  const rows = summary.rows;

  it("has one row per class (10), per school (4) and one for all schools", () => {
    expect(rows.filter((r) => r.kind === "class")).toHaveLength(10);
    expect(rows.filter((r) => r.kind === "school")).toHaveLength(4);
    expect(rows.filter((r) => r.kind === "all")).toHaveLength(1);
  });

  it("Rule 1: classes with fewer than 5 students show <5 in EVERY cell", () => {
    for (const [school, cls] of [["School A", "VIII"], ["School B", "XI"], ["School D", "XI"]]) {
      for (const col of COLUMNS) expect(row(rows, school, cls).cells[col]).toEqual({ kind: "small" });
    }
  });

  it("Rule 2: no visible count is between 1 and 4", () => {
    for (const r of rows) {
      for (const col of COLUMNS) {
        const c = r.cells[col];
        if (c.kind === "count") expect(c.value === 0 || c.value >= MIN_GROUP_SIZE).toBe(true);
      }
    }
  });

  it("Rule 3: School D's small class can't be worked out by subtraction (D has only 8 students)", () => {
    const xii = row(rows, "School D", "XII");
    const d = row(rows, "School D", null);
    for (const col of COLUMNS) {
      // If both the school and the other class were shown, XI = D − XII.
      expect(d.cells[col].kind === "count" && xii.cells[col].kind === "count" && d.cells[col].value - xii.cells[col].value > 0).toBe(false);
    }
  });

  it("Rule 3: no line of the table ever has exactly one hidden number", () => {
    // The simplest subtraction attack, checked directly on every row.
    for (const r of rows) {
      const hiddenCount = COLUMNS.filter((c) => r.cells[c].kind !== "count").length;
      expect(hiddenCount).not.toBe(1);
    }
  });

  it("independent audit: every hidden number could still be at least two different values", () => {
    expect(auditTable(rows)).toEqual([]);
  });

  it("never contains a student ID, a comment or an answer", () => {
    const json = JSON.stringify(summary);
    expect(json).not.toMatch(/S-\d/);
    for (const s of students) {
      if (s.comment) expect(json).not.toContain(s.comment);
    }
    expect(json).not.toMatch(/q\d|self-harm|comment|Prefer not/i);
  });

  it("hidden cells carry no value at all (nothing to find in the browser's dev tools)", () => {
    for (const r of rows) {
      for (const col of COLUMNS) {
        const c = r.cells[col];
        if (c.kind !== "count") expect(Object.keys(c)).toEqual(["kind"]);
      }
    }
  });
});

describe("raw counts (server side, before suppression)", () => {
  it("add up to the expected flag totals", () => {
    const all = countRows(students, { useExtraRules: true }).find((r) => r.kind === "all")!;
    expect(all.counts).toEqual({ Urgent: 2, High: 17, Review: 17, None: 36, Total: 72 });
  });

  it("orders classes by Roman numeral value (IX before X, XI before XII)", () => {
    expect(romanToNumber("IV")).toBe(4);
    expect(romanToNumber("IX")).toBe(9);
    expect(romanToNumber("XII")).toBe(12);
    const b = countRows(students, { useExtraRules: true }).filter((r) => r.school === "School B" && r.kind === "class");
    expect(b.map((r) => r.className)).toEqual(["IX", "X", "XI"]);
  });
});

describe("suppress() on small hand-made tables", () => {
  const counts = (Urgent: number, High: number, Review: number, None: number) => ({
    Urgent, High, Review, None, Total: Urgent + High + Review + None,
  });

  it("hides more numbers when one small count could be worked out from the row total", () => {
    // Urgent = 1 is hidden, but 12 − 5 − 0 − 6 = 1 would expose it.
    const rows: CountRow[] = [{ kind: "class", school: "S", className: "VI", counts: counts(1, 5, 0, 6) }];
    const [safe] = suppress(rows);
    expect(safe.cells.Urgent).toEqual({ kind: "small" });
    expect(safe.cells.High).toEqual({ kind: "hidden" });
    // High ≥ 5 and Urgent ≥ 1 would still force Urgent = 1, High = 5, so a third number is hidden too.
    expect(safe.cells.None).toEqual({ kind: "hidden" });
    expect(safe.cells.Total).toEqual({ kind: "count", value: 12 });
  });

  it("leaves a table with no small numbers untouched", () => {
    const rows: CountRow[] = [{ kind: "class", school: "S", className: "VI", counts: counts(5, 6, 7, 8) }];
    expect(suppress(rows)[0].cells).toEqual({
      Urgent: { kind: "count", value: 5 },
      High: { kind: "count", value: 6 },
      Review: { kind: "count", value: 7 },
      None: { kind: "count", value: 8 },
      Total: { kind: "count", value: 26 },
    });
  });

  it("shows zeros (a zero identifies nobody)", () => {
    const rows: CountRow[] = [{ kind: "class", school: "S", className: "VI", counts: counts(0, 0, 6, 8) }];
    expect(suppress(rows)[0].cells.Urgent).toEqual({ kind: "count", value: 0 });
  });
});

describe("GET /api/supervisor/summary", () => {
  it("returns suppressed aggregates only: no student IDs anywhere in the response", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toMatch(/S-\d/);
    const body = JSON.parse(text);
    expect(Object.keys(body)).toEqual(["rows", "usesExtraRules"]);
    expect(body.rows).toEqual(summaries.extras.rows);
  });
});

describe("followUpCell: students who need follow-up, per school", () => {
  const rows = summaries.extras.rows;
  it("is worked out from shown numbers only (students − no concerns)", () => {
    expect(followUpCell(row(rows, "School A", null))).toEqual({ kind: "count", value: 14 });
    expect(followUpCell(row(rows, "All schools", null))).toEqual({ kind: "count", value: 36 });
  });
  it("shows a result from 1 to 4 as small (School D: 8 − 5 = 3)", () => {
    expect(followUpCell(row(rows, "School D", null))).toEqual({ kind: "small" });
  });
  it("is hidden when either number it needs is hidden", () => {
    expect(followUpCell(row(rows, "School A", "VIII"))).toEqual({ kind: "hidden" });
  });
});

describe("support given, by school (P-01): counts only, same suppression rules", () => {
  const people = students.map((s) => ({ studentId: s.studentId, school: s.school }));
  const many = [
    ...Array.from({ length: 6 }, () => ({ studentId: "S-001", type: "check_in_meeting" as const })),
    ...Array.from({ length: 5 }, () => ({ studentId: "S-030", type: "check_in_meeting" as const })),
    { studentId: "S-070", type: "referral_external" as const },
  ];
  const table = interventionTable(people, many);

  it("has one row per school plus all schools", () => {
    expect(table.map((r) => r.school)).toEqual(["School A", "School B", "School C", "School D", "All schools"]);
  });

  it("never shows a count from 1 to 4 (School D's single referral is hidden)", () => {
    for (const r of table) for (const c of Object.values(r.cells)) if (c.kind === "count") expect(c.value === 0 || c.value >= 5).toBe(true);
    expect(table.find((r) => r.school === "School D")!.cells.referral_external.kind).toBe("small");
  });

  it("contains no student IDs and no notes", () => {
    expect(JSON.stringify(table)).not.toMatch(/S-\d/);
  });

  it("shows bigger counts (School A: 6 meetings)", () => {
    expect(table.find((r) => r.school === "School A")!.cells.check_in_meeting).toEqual({ kind: "count", value: 6 });
  });
});

describe("heat map (P-03) reuses the suppressed cells", () => {
  const rows = summaries.extras.rows;
  const a = row(rows, "School A", null);

  it("shares are worked out only from shown numbers (School A Review: 7 of 26 = 27%)", () => {
    const c = heatCell(a.cells.Review, a.cells.Total);
    expect(c.kind === "count" && percent(c.share!)).toBe("27%");
    expect(c.kind === "count" && c.step).toBe(2); // 25–50% band
  });

  it("hidden cells stay hidden as numbers AND as percentages", () => {
    expect(heatCell(a.cells.High, a.cells.Total)).toEqual({ kind: "hidden" });
    expect(heatCell(a.cells.Urgent, a.cells.Total)).toEqual({ kind: "small" });
  });

  it("no share is shown when the total itself is hidden (Class VII)", () => {
    const vii = row(rows, "School A", "VII");
    expect(heatCell(vii.cells.Review, vii.cells.Total)).toEqual({ kind: "count", value: 5, share: null, step: null });
  });

  it("zero has no shade, and every heat cell carries no student data", () => {
    const c = row(rows, "School C", null);
    expect(heatCell(c.cells.Urgent, c.cells.Total)).toEqual({ kind: "count", value: 0, share: 0, step: null });
    expect(JSON.stringify(rows.map((r) => heatCell(r.cells.None, r.cells.Total)))).not.toMatch(/S-\d/);
  });
});
