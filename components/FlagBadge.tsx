import { Eye, Minus, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { FlagLevel } from "@/lib/flags";
import { T } from "./T";

// One look per flag level, used everywhere (board, drawer, supervisor table and chart) for consistency.
// Never colour alone (WCAG 1.4.1): every level also has its own icon and text label.
export const LEVEL_STYLE: Record<
  FlagLevel,
  { icon: LucideIcon; solid: string; tint: string; ink: string; border: string }
> = {
  Urgent: { icon: OctagonAlert, solid: "bg-urgent", tint: "bg-urgent-tint", ink: "text-urgent-ink", border: "border-urgent" },
  High: { icon: TriangleAlert, solid: "bg-high", tint: "bg-high-tint", ink: "text-high-ink", border: "border-high" },
  Review: { icon: Eye, solid: "bg-review", tint: "bg-review-tint", ink: "text-review-ink", border: "border-review" },
  None: { icon: Minus, solid: "bg-none-mark", tint: "bg-none-tint", ink: "text-none-ink", border: "border-none-mark" },
};

// Visual weight follows urgency: Urgent is the ONLY solid badge (white on dark red), so it
// stands out pre-attentively. The others are tinted with dark text and a coloured border.
export function FlagBadge({ level }: { level: FlagLevel }) {
  const { icon: Icon, solid, tint, ink, border } = LEVEL_STYLE[level];
  const look = level === "Urgent" ? `${solid} border-urgent text-white` : `${tint} ${ink} ${border}`;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border-2 px-2.5 py-0.5 text-sm font-bold ${look}`}>
      <Icon aria-hidden size={16} strokeWidth={2.5} />
      <T k={`level.${level}`} />
    </span>
  );
}
