"use client";

import { useRef } from "react";

export interface TabDef<K extends string> {
  key: K;
  label: string;
  shortLabel?: string; // used on phones so every tab fits without scrolling
  count?: number; // shown as a number, never as a colour-only dot
}

// The counsellor's views (Board · Caseload · Inbox · Check-ins), as a quiet underline navigation.
// A real ARIA tab list: arrow keys move between tabs; screen readers announce "tab, 2 of 4, selected".
export function WorkspaceTabs<K extends string>({ tabs, active, onChange }: { tabs: TabDef<K>[]; active: K; onChange: (k: K) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + tabs.length) % tabs.length;
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Views" className="flex gap-1 border-b border-separator sm:gap-6">
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
            className={`-mb-px inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 border-b-2 px-1 text-[14px] whitespace-nowrap transition-colors duration-150 sm:flex-none sm:justify-start sm:text-[15px] ${
              selected ? "border-primary font-medium text-text" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {t.shortLabel ? (
              <>
                <span className="sm:hidden">{t.shortLabel}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </>
            ) : (
              t.label
            )}
            {t.count !== undefined && t.count > 0 && <span className="tabular text-[13px] text-text-muted">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
