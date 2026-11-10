"use client";

import { useRef } from "react";

export interface TabDef<K extends string> {
  key: K;
  label: string;
  count?: number; // shown as text ("Inbox 3"), never as a colour-only dot
}

// The counsellor's tabs (Board · My caseload · Inbox · Moderation). A real ARIA tab list:
// arrow keys move between tabs, and screen readers announce "tab, 2 of 3, selected".
export function WorkspaceTabs<K extends string>({ tabs, active, onChange }: { tabs: TabDef<K>[]; active: K; onChange: (k: K) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + tabs.length) % tabs.length;
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Views" className="flex gap-1 overflow-x-auto rounded-[12px] bg-fill p-1">
      {tabs.map((t, i) => {
        const selected = t.key === active;
        return (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={selected}
            aria-controls={`panel-${t.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(i, 1);
              if (e.key === "ArrowLeft") move(i, -1);
            }}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[9px] px-4 text-[15px] whitespace-nowrap ${
              selected ? "bg-surface font-semibold shadow-[0_1px_3px_hsla(0,0%,0%,.12)]" : "text-text"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="tabular rounded-full bg-primary px-2 text-[12px] font-semibold text-white">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
