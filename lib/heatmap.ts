// P-03: supervisor heat map. Pure functions over the SAME suppressed cells as the table (AC-05).
// A share (percentage) is worked out only from two numbers that are already shown, so it can
// never reveal a hidden one. Hidden cells stay hidden, as numbers and as percentages.

import type { SafeCell } from "./suppression";

/** Single-hue teal scale, light to dark (colour-blind safe, reads in order). Text: dark on 1–4, white on 5. */
export const HEAT_SCALE = ["#EEF4F1", "#D4E5DD", "#AECBBF", "#7FA89A", "#2F5F53"] as const;
export const HEAT_STEPS = [
  { upTo: 0.1, label: "up to 10%" },
  { upTo: 0.25, label: "10–25%" },
  { upTo: 0.5, label: "25–50%" },
  { upTo: 0.75, label: "50–75%" },
  { upTo: 1, label: "over 75%" },
];

export type HeatCell =
  | { kind: "count"; value: number; share: number | null; step: number | null } // step: index into HEAT_SCALE
  | { kind: "small" }
  | { kind: "hidden" };

export function heatCell(cell: SafeCell, total: SafeCell): HeatCell {
  if (cell.kind !== "count") return { kind: cell.kind };
  if (total.kind !== "count" || total.value === 0) return { kind: "count", value: cell.value, share: null, step: null };
  const share = cell.value / total.value;
  return { kind: "count", value: cell.value, share, step: share === 0 ? null : HEAT_STEPS.findIndex((s) => share <= s.upTo) };
}

export const percent = (share: number) => `${Math.round(share * 100)}%`;
