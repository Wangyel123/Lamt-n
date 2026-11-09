import { FLAG_LEVELS, LEVEL_NAME, levelMeaning, type FlagLevel } from "@/lib/flags";
import { LEVEL_STYLE } from "./FlagBadge";

interface Props {
  counts: Record<FlagLevel, number>;
  selected: FlagLevel | null;
  useExtraRules: boolean;
  onSelect: (level: FlagLevel | null) => void;
}

// The four priorities, top-left where people look first. Each tile says WHAT the priority means
// in plain words, so nobody has to guess what "Review" is. Tap a tile to show only that group.
export function SummaryCards({ counts, selected, useExtraRules, onSelect }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Show only one priority">
      {FLAG_LEVELS.map((level) => {
        const { icon: Icon, ink } = LEVEL_STYLE[level];
        const isSelected = selected === level;
        return (
          <li key={level}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : level)}
              className={`flex h-full w-full flex-col rounded-2xl bg-surface p-4 text-left transition-shadow duration-150 hover:shadow-[0_4px_6px_hsla(0,0%,0%,.06)] ${
                isSelected ? "ring-2 ring-primary" : level === "Urgent" ? "ring-2 ring-urgent" : ""
              }`}
            >
              <span className={`flex items-center gap-1.5 text-[15px] font-semibold ${ink}`}>
                <Icon aria-hidden size={16} strokeWidth={2.5} />
                {LEVEL_NAME[level]}
              </span>
              <span className="tabular mt-1 text-[34px] leading-tight font-bold">{counts[level]}</span>
              <span className="mt-1 text-[13px] leading-snug text-text-muted">{levelMeaning(level, useExtraRules)}</span>
              <span className="sr-only">{isSelected ? "Showing only these. Press to show everyone." : "Press to show only these."}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
