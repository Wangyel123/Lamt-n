import { Eye, Minus, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { LEVEL_NAME, type FlagLevel } from "@/lib/flags";

// One look per priority, used everywhere. Never colour alone: a dot AND the word.
// Only Urgent uses coloured text, so it is the one thing that stands out.
export const LEVEL_STYLE: Record<FlagLevel, { icon: LucideIcon; dot: string; tint: string; ink: string; bar: string }> = {
  Urgent: { icon: OctagonAlert, dot: "bg-urgent", tint: "bg-urgent-tint", ink: "text-urgent-ink", bar: "bg-urgent" },
  High: { icon: TriangleAlert, dot: "bg-high", tint: "bg-high-tint", ink: "text-high-ink", bar: "bg-high" },
  Review: { icon: Eye, dot: "bg-review", tint: "bg-review-tint", ink: "text-review-ink", bar: "bg-review" },
  None: { icon: Minus, dot: "bg-none-mark", tint: "bg-none-tint", ink: "text-none-ink", bar: "bg-none-mark" },
};

/** The small coloured dot for a priority (decorative: the word next to it carries the meaning). */
export function PriorityDot({ level, className = "" }: { level: FlagLevel; className?: string }) {
  const ring = level === "Urgent" ? "ring-[3px] ring-urgent/15" : "";
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${LEVEL_STYLE[level].dot} ${ring} ${className}`} />;
}
/** Kept for older call sites. */
export const LevelIcon = PriorityDot;

export function FlagBadge({ level }: { level: FlagLevel }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium ${level === "Urgent" ? "text-urgent-ink" : "text-text-muted"}`}>
      <PriorityDot level={level} />
      {LEVEL_NAME[level]}
    </span>
  );
}
