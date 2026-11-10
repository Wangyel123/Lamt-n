import { FLAG_LEVELS, LEVEL_NAME, type FlagLevel } from "@/lib/flags";
import { PriorityDot } from "./FlagBadge";

interface Props {
  counts: Record<FlagLevel, number>;
  selected: FlagLevel | null;
  onSelect: (level: FlagLevel | null) => void;
  useExtraRules?: boolean; // (meanings are shown in the section headings below)
}

// One quiet segmented filter: each priority with its count. Tap to show only that group, tap
// again for everyone. What each priority means is written under each section heading.
export function SummaryCards({ counts, selected, onSelect }: Props) {
  return (
    <ul className="grid grid-cols-2 overflow-hidden rounded-[14px] border border-separator bg-surface sm:grid-cols-4" aria-label="Show only one priority">
      {FLAG_LEVELS.map((level, i) => {
        const isSelected = selected === level;
        return (
          <li key={level} className={`border-separator ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : level)}
              className={`flex h-full w-full flex-col gap-1 px-5 py-4 text-left transition-colors duration-150 ${isSelected ? "bg-primary-soft" : "hover:bg-fill"}`}
            >
              <span className={`flex items-center gap-2 text-[13px] font-medium ${level === "Urgent" ? "text-urgent-ink" : "text-text-muted"}`}>
                <PriorityDot level={level} />
                {LEVEL_NAME[level]}
              </span>
              <span className={`tabular text-[26px] leading-none font-semibold tracking-[-0.02em] ${level === "Urgent" ? "text-urgent-ink" : ""}`}>
                {counts[level]}
              </span>
              <span className="sr-only">students. {isSelected ? "Showing only these. Press to show everyone." : "Press to show only these."}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
