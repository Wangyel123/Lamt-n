"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { activeFilterChips, EMPTY_FILTERS, hasActiveFilters, STATUS_FILTER_LABELS, type Filters as FilterValues, type StatusFilter } from "@/lib/filters";

interface Props {
  filters: FilterValues;
  schools: string[];
  classes: string[];
  onChange: (filters: FilterValues) => void;
  layout?: "row" | "stack"; // "stack" inside the phone filter sheet
}

const pill = "min-h-11 w-full appearance-none rounded-[10px] border border-separator-strong bg-surface py-2 pr-9 pl-3 text-[14px] font-medium transition-colors hover:border-border";

function Picker({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={pill}>
        {children}
      </select>
      <ChevronDown aria-hidden size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted" />
    </label>
  );
}

/** Search by student ID (AC-06). */
export function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative block flex-1">
      <span className="sr-only">Search by student ID</span>
      <Search aria-hidden size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by student ID"
        className="min-h-11 w-full rounded-[10px] border border-separator-strong bg-surface py-2 pr-4 pl-10 text-[15px] placeholder:text-text-muted/80 transition-colors hover:border-border focus:border-primary"
      />
    </label>
  );
}

/** School / class / follow-up pickers (AC-06). Priority is picked with the tiles above. */
export function FilterPickers({ filters, schools, classes, onChange, layout = "row" }: Props) {
  const set = (patch: Partial<FilterValues>) => onChange({ ...filters, ...patch });
  return (
    <div className={layout === "row" ? "flex gap-2" : "space-y-3"}>
      <Picker
        label="School"
        value={filters.school ?? ""}
        // A class like "XI" may not exist in the new school, so reset the class too.
        onChange={(v) => set({ school: v || null, className: null })}
      >
        <option value="">All schools</option>
        {schools.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Picker>
      <Picker label="Class" value={filters.className ?? ""} onChange={(v) => set({ className: v || null })}>
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c} value={c}>
            Class {c}
          </option>
        ))}
      </Picker>
      <Picker label="Follow-up" value={filters.status ?? ""} onChange={(v) => set({ status: (v || null) as StatusFilter | null })}>
        <option value="">Any follow-up</option>
        {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_FILTER_LABELS[s]}
          </option>
        ))}
      </Picker>
    </div>
  );
}

/** Removable chips for whatever is filtering the list right now. */
export function ActiveFilters({ filters, onChange }: { filters: FilterValues; onChange: (f: FilterValues) => void }) {
  if (!hasActiveFilters(filters)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilterChips(filters).map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange({ ...filters, [chip.key]: chip.key === "search" ? "" : null })}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-separator bg-surface px-3 text-[14px] font-medium text-text hover:bg-fill"
        >
          {chip.label}
          <X aria-hidden size={14} />
        </button>
      ))}
      <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="min-h-11 rounded-[10px] px-3 text-[14px] font-medium text-primary hover:bg-fill">
        Clear all
      </button>
    </div>
  );
}
