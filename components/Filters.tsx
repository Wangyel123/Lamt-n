"use client";

import { useT } from "@/lib/useLang";
import { T } from "./T";
import { Search, X } from "lucide-react";
import { FLAG_LEVELS, type FlagLevel } from "@/lib/flags";
import {
  activeFilterChips,
  EMPTY_FILTERS,
  hasActiveFilters,
  STATUS_FILTER_LABELS,
  type Filters as FilterValues,
  type StatusFilter,
} from "@/lib/filters";

interface Props {
  filters: FilterValues;
  schools: string[];
  classes: string[];
  onChange: (filters: FilterValues) => void;
}

const selectClass = "min-h-11 w-full rounded-lg border border-border bg-surface px-3";

// AC-06: filter by school, class, flag level, follow-up status, and search by ID.
// Plain <select>s: familiar, keyboard-friendly and native on phones.
export function Filters({ filters, schools, classes, onChange }: Props) {
  const t = useT();
  const set = (patch: Partial<FilterValues>) => onChange({ ...filters, ...patch });
  const chips = activeFilterChips(filters);

  return (
    <section aria-label="Filters" className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm font-bold lg:col-span-1">
          {t("filters.search")}
          <span className="relative mt-1 block font-normal">
            <Search aria-hidden size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder="e.g. S-045"
              className={`${selectClass} pl-9`}
            />
          </span>
        </label>

        <label className="block text-sm font-bold">
          <T k="filters.school" />
          <select
            value={filters.school ?? ""}
            // A class like "XI" may not exist in the new school, so reset the class too.
            onChange={(e) => set({ school: e.target.value || null, className: null })}
            className={`${selectClass} mt-1 font-normal`}
          >
            <option value="">{t("filters.allSchools")}</option>
            {schools.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold">
          <T k="filters.class" />
          <select
            value={filters.className ?? ""}
            onChange={(e) => set({ className: e.target.value || null })}
            className={`${selectClass} mt-1 font-normal`}
          >
            <option value="">{t("filters.allClasses")}</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold">
          {t("filters.level")}
          <select
            value={filters.level ?? ""}
            onChange={(e) => set({ level: (e.target.value || null) as FlagLevel | null })}
            className={`${selectClass} mt-1 font-normal`}
          >
            <option value="">{t("filters.allLevels")}</option>
            {FLAG_LEVELS.map((l) => (
              <option key={l} value={l}>
                {t(`level.${l}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold">
          {t("filters.followUp")}
          <select
            value={filters.status ?? ""}
            onChange={(e) => set({ status: (e.target.value || null) as StatusFilter | null })}
            className={`${selectClass} mt-1 font-normal`}
          >
            <option value="">{t("filters.anyStatus")}</option>
            {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_FILTER_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasActiveFilters(filters) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-muted">Showing:</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => set({ [chip.key]: chip.key === "search" ? "" : null })}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary bg-surface px-3 text-sm text-primary hover:bg-bg"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <X aria-hidden size={14} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="min-h-11 px-2 text-sm font-bold text-primary underline underline-offset-2"
          >
            {t("filters.clear")}
          </button>
        </div>
      )}
    </section>
  );
}
