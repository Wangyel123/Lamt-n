// Small-number suppression for the supervisor view (AC-05).
//
// Goal: a supervisor sees patterns across schools, but can never work out how many
// (or which) children in a small group gave a worrying answer.
//
// The brief says "any group with fewer than 5 students shown as <5". It doesn't say
// whether "group" means a class or a single count, so we take the STRICTER reading
// and apply both:
//   Rule 1 (small group): a class with fewer than 5 students shows "<5" in every cell.
//   Rule 2 (small count): any count from 1 to 4 shows "<5". (0 is shown: it identifies no one.)
//   Rule 3 (no working it out): hiding is useless if the number can be recovered by
//     subtraction, e.g. School D total − Class XII = Class XI. So for every line of the
//     table that must add up (a row: Urgent+High+Review+None = Total; a column: the
//     classes add up to the school, the schools add up to "All schools"), we check the
//     smallest and largest each hidden number could be. If they are equal, the number is
//     exposed, so we hide one more number in that line ("hidden"). Repeat until safe.
//
// Runs on the SERVER only. The browser receives "<5" / "hidden", never the real value.

export const MIN_GROUP_SIZE = 5;

export const LEVEL_COLUMNS = ["Urgent", "High", "Review", "None"] as const;
export const COLUMNS = [...LEVEL_COLUMNS, "Total"] as const;
export type Column = (typeof COLUMNS)[number];

export type RowKind = "class" | "school" | "all";

/**
 * Raw counts for one table row. Server-side only: never send these to the browser.
 * Generic over the columns, so the same rules protect any table that adds up to a "Total"
 * (flag levels, interventions by type, check-in responses...).
 */
export interface TableRow<C extends string> {
  kind: RowKind;
  school: string; // "All schools" for the grand total row
  className: string | null; // null for school and "All schools" rows
  counts: Record<C | "Total", number>;
}
export type CountRow = TableRow<(typeof LEVEL_COLUMNS)[number]>;

/** What the browser is allowed to see for one cell. Hidden cells carry no value at all. */
export type SafeCell = { kind: "count"; value: number } | { kind: "small" } | { kind: "hidden" };

export interface SafeTableRow<C extends string> {
  kind: RowKind;
  school: string;
  className: string | null;
  cells: Record<C | "Total", SafeCell>;
}
export type SafeRow = SafeTableRow<(typeof LEVEL_COLUMNS)[number]>;

// ---------------------------------------------------------------------------
// Internal working cell: the real value plus what an outsider could know about it.
// ---------------------------------------------------------------------------
interface WorkCell {
  value: number;
  status: "shown" | "small" | "hidden";
  min: number; // smallest value an outsider knows this cell could have
  max: number; // largest value an outsider knows this cell could have
}

// A line is a set of cells that must add up: sum(parts) = whole.
interface Line {
  parts: WorkCell[];
  whole: WorkCell;
}

const shownCell = (value: number): WorkCell => ({ value, status: "shown", min: value, max: value });

function markSmall(cell: WorkCell, min: number) {
  cell.status = "small";
  cell.min = min;
  cell.max = MIN_GROUP_SIZE - 1;
}

/** The flag-level table (AC-05). */
export function suppress(rows: CountRow[]): SafeRow[] {
  return suppressTable(rows, LEVEL_COLUMNS);
}

/** Any table whose `parts` columns add up to "Total" in every row. */
export function suppressTable<C extends string>(rows: TableRow<C>[], parts: readonly C[]): SafeTableRow<C>[] {
  type Col = C | "Total";
  const columns: Col[] = [...parts, "Total"];
  const grid = rows.map((row) => {
    const cells = {} as Record<Col, WorkCell>;
    for (const col of columns) cells[col] = shownCell(row.counts[col]);
    return cells;
  });

  // Rule 1 — small group: the whole row becomes "<5".
  // Each level count could be 0–4; the total is 1–4.
  rows.forEach((row, i) => {
    if (row.counts.Total < MIN_GROUP_SIZE) {
      for (const col of columns) markSmall(grid[i][col], col === "Total" ? 1 : 0);
    }
  });

  // Rule 2 — small count: any 1–4 becomes "<5".
  for (const cells of grid) {
    for (const col of columns) {
      const cell = cells[col];
      if (cell.status === "shown" && cell.value > 0 && cell.value < MIN_GROUP_SIZE) markSmall(cell, 1);
    }
  }

  // Rule 3 — complementary suppression: keep hiding until no hidden number can be worked out.
  const lines = buildLines(rows, grid, parts);
  let changed = true;
  while (changed) {
    changed = false;
    for (const line of lines) {
      if (isExposed(line) && hideOneMore(line)) changed = true;
    }
  }

  // Only now convert to what the browser may see. Hidden values are dropped here.
  return rows.map((row, i) => {
    const cells = {} as Record<Col, SafeCell>;
    for (const col of columns) cells[col] = toSafeCell(grid[i][col]);
    return { kind: row.kind, school: row.school, className: row.className, cells };
  });
}

function toSafeCell(cell: WorkCell): SafeCell {
  if (cell.status === "small") return { kind: "small" };
  if (cell.status === "hidden") return { kind: "hidden" };
  return { kind: "count", value: cell.value };
}

/** Every row, and every column within each school and across schools, must add up. */
function buildLines<C extends string>(rows: TableRow<C>[], grid: Record<C | "Total", WorkCell>[], parts: readonly C[]): Line[] {
  const lines: Line[] = [];
  const columns: (C | "Total")[] = [...parts, "Total"];
  const indexes = (pred: (r: TableRow<C>) => boolean) => rows.flatMap((r, i) => (pred(r) ? [i] : []));

  // Across each row: the parts (e.g. Urgent + High + Review + None) = Total
  grid.forEach((cells) => lines.push({ parts: parts.map((c) => cells[c]), whole: cells.Total }));

  // Down each column: a school's classes add up to the school row
  for (const s of indexes((r) => r.kind === "school")) {
    const classes = indexes((r) => r.kind === "class" && r.school === rows[s].school);
    for (const col of columns) lines.push({ parts: classes.map((i) => grid[i][col]), whole: grid[s][col] });
  }

  // Down each column: the schools add up to "All schools"
  for (const a of indexes((r) => r.kind === "all")) {
    const schools = indexes((r) => r.kind === "school");
    for (const col of columns) lines.push({ parts: schools.map((i) => grid[i][col]), whole: grid[a][col] });
  }
  return lines;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const low = (c: WorkCell) => (c.status === "shown" ? c.value : c.min);
const high = (c: WorkCell) => (c.status === "shown" ? c.value : c.max);

/** The smallest and largest value `target` could have, given everything else in the line. */
export function possibleRange(target: WorkCell, line: Line): [number, number] {
  let lo: number;
  let hi: number;
  if (target === line.whole) {
    lo = sum(line.parts.map(low));
    hi = sum(line.parts.map(high));
  } else {
    const others = line.parts.filter((p) => p !== target);
    lo = low(line.whole) - sum(others.map(high));
    hi = high(line.whole) - sum(others.map(low));
  }
  return [Math.max(lo, target.min), Math.min(hi, target.max)];
}

/**
 * True if any hidden cell in the line can be pinned to a single NON-ZERO value.
 * Being able to work out a 0 is allowed, for the same reason Rule 2 shows zeros:
 * "nobody in this group" identifies no child. (Example: School D has 0 Urgent, so its
 * small class XI must also have 0 Urgent. That reveals nothing about any one student.)
 */
function isExposed(line: Line): boolean {
  return [...line.parts, line.whole].some((cell) => {
    if (cell.status === "shown") return false;
    const [lo, hi] = possibleRange(cell, line);
    return lo === hi && lo > 0;
  });
}

/**
 * Hides the smallest shown non-zero part of the line (or the line's total if no part is left).
 * Why non-zero: every shown non-zero number is at least 5 after Rule 2, so a hidden one is
 * known only to be "5 or more", which keeps the small numbers uncertain.
 */
function hideOneMore(line: Line): boolean {
  const candidates = line.parts
    .filter((c) => c.status === "shown" && c.value > 0)
    .sort((a, b) => a.value - b.value);
  const target =
    candidates[0] ?? (line.whole.status === "shown" && line.whole.value > 0 ? line.whole : undefined);
  // Nothing left to hide in this line. The test suite's independent audit
  // (tests/suppression.test.ts) would catch any exposure left behind.
  if (!target) return false;
  target.status = "hidden";
  target.min = MIN_GROUP_SIZE;
  target.max = Infinity;
  return true;
}
