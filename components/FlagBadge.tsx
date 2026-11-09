import { Eye, Minus, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { FlagLevel } from "@/lib/flags";

// One look per flag level, used everywhere (board, drawer, supervisor view) for consistency.
// Never colour alone (WCAG 1.4.1): every level also has its own icon and text label.
export const LEVEL_STYLE: Record<
  FlagLevel,
  { icon: LucideIcon; solid: string; tint: string; ink: string; border: string }
> = {
  Urgent: { icon: OctagonAlert, solid: "bg-urgent", tint: "bg-urgent-tint", ink: "text-urgent-ink", border: "border-urgent" },
  High: { icon: TriangleAlert, solid: "bg-high", tint: "bg-high-tint", ink: "text-high-ink", border: "border-high" },
  Review: { icon: Eye, solid: "bg-review", tint: "bg-review-tint", ink: "text-review-ink", border: "border-review" },
  None: { icon: Minus, solid: "bg-none", tint: "bg-none-tint", ink: "text-none-ink", border: "border-border" },
};

export function FlagBadge({ level }: { level: FlagLevel }) {
  const { icon: Icon, solid } = LEVEL_STYLE[level];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold text-white ${solid}`}
    >
      <Icon aria-hidden size={16} strokeWidth={2.5} />
      {/* The only all-caps text in the app: a tiny label that must stand out */}
      {level === "Urgent" ? "URGENT" : level}
    </span>
  );
}
