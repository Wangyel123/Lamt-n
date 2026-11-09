import { FLAG_LEVELS, type FlagLevel } from "@/lib/flags";
import { LEVEL_STYLE } from "./FlagBadge";

interface Props {
  counts: Record<FlagLevel, number>;
  selected: FlagLevel | null;
  onSelect: (level: FlagLevel | null) => void;
}

// Four count cards at the top-left, where people look first (F-pattern).
// Each card is also a filter button: click to show only that level, click again to clear.
export function SummaryCards({ counts, selected, onSelect }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Filter by flag level">
      {FLAG_LEVELS.map((level) => {
        const { icon: Icon, tint, ink, border } = LEVEL_STYLE[level];
        const isSelected = selected === level;
        return (
          <li key={level}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : level)}
              className={`w-full rounded-lg border bg-surface p-3 text-left transition-colors duration-150 hover:bg-bg ${
                isSelected
                  ? "border-primary ring-2 ring-primary"
                  : level === "Urgent"
                    ? `border-2 ${border}`
                    : "border-border"
              }`}
            >
              <span className={`flex items-center gap-1.5 text-sm font-bold ${ink}`}>
                <span className={`rounded p-1 ${tint}`}>
                  <Icon aria-hidden size={16} />
                </span>
                {level}
              </span>
              <span className="tabular mt-1 block text-3xl font-bold">{counts[level]}</span>
              <span className="sr-only">students. {isSelected ? "Showing only these. Press to show all." : "Press to show only these."}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
