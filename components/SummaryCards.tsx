import { FLAG_LEVELS, type FlagLevel } from "@/lib/flags";
import { LEVEL_STYLE } from "./FlagBadge";

// Four count cards at the top-left, where people look first (F-pattern).
// Phase 4 turns them into filter buttons.
export function SummaryCards({ counts }: { counts: Record<FlagLevel, number> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Number of students at each flag level">
      {FLAG_LEVELS.map((level) => {
        const { icon: Icon, tint, ink, border } = LEVEL_STYLE[level];
        return (
          <li
            key={level}
            className={`rounded-lg border bg-surface p-3 ${level === "Urgent" ? `border-2 ${border}` : "border-border"}`}
          >
            <p className={`flex items-center gap-1.5 text-sm font-bold ${ink}`}>
              <span className={`rounded p-1 ${tint}`}>
                <Icon aria-hidden size={16} />
              </span>
              {level}
            </p>
            <p className="tabular mt-1 text-3xl font-bold">{counts[level]}</p>
          </li>
        );
      })}
    </ul>
  );
}
