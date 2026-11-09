import { Eye, Minus, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { LEVEL_NAME, type FlagLevel } from "@/lib/flags";

// One look per priority, used everywhere for consistency.
// Never colour alone (WCAG 1.4.1): every priority also has its own icon and word.
export const LEVEL_STYLE: Record<FlagLevel, { icon: LucideIcon; solid: string; tint: string; ink: string; bar: string }> = {
  Urgent: { icon: OctagonAlert, solid: "bg-urgent", tint: "bg-urgent-tint", ink: "text-urgent-ink", bar: "bg-urgent" },
  High: { icon: TriangleAlert, solid: "bg-high", tint: "bg-high-tint", ink: "text-high-ink", bar: "bg-high" },
  Review: { icon: Eye, solid: "bg-review", tint: "bg-review-tint", ink: "text-review-ink", bar: "bg-review" },
  None: { icon: Minus, solid: "bg-none-mark", tint: "bg-none-tint", ink: "text-none-ink", bar: "bg-none-mark" },
};

// Visual weight follows urgency: Urgent is the ONLY solid badge (white on dark red, 6.57:1),
// so it stands out at a glance. The others are soft tinted pills with dark text.
export function FlagBadge({ level }: { level: FlagLevel }) {
  const { icon: Icon, solid, tint, ink } = LEVEL_STYLE[level];
  const look = level === "Urgent" ? `${solid} text-white` : `${tint} ${ink}`;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${look}`}>
      <Icon aria-hidden size={14} strokeWidth={2.5} />
      {LEVEL_NAME[level]}
    </span>
  );
}

/** The priority icon in a soft circle: the leading element of every list row. */
export function LevelIcon({ level }: { level: FlagLevel }) {
  const { icon: Icon, solid, tint, ink } = LEVEL_STYLE[level];
  const look = level === "Urgent" ? `${solid} text-white` : `${tint} ${ink}`;
  return (
    <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-full ${look}`}>
      <Icon size={18} strokeWidth={2.25} />
    </span>
  );
}
