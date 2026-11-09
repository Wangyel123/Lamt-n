"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { activeFilterChips, EMPTY_FILTERS, type Filters as FilterValues } from "@/lib/filters";
import { useT } from "@/lib/useLang";
import { Filters } from "./Filters";

interface Props {
  filters: FilterValues;
  schools: string[];
  classes: string[];
  onChange: (filters: FilterValues) => void;
}

// Phones only (hidden from the sm breakpoint up, where the filters sit inline).
// One button instead of five dropdowns keeps the small screen calm (Hick's Law); the filters
// open in a bottom sheet, within thumb reach. Native <dialog>: focus trap + Escape for free.
export function FilterSheet(props: Props) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const activeCount = activeFilterChips(props.filters).length;

  const show = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const hide = () => dialogRef.current?.close(); // onClose below resets `open`

  return (
    <div className="flex items-center gap-2 sm:hidden">
      <button
        type="button"
        onClick={show}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 font-bold"
      >
        <SlidersHorizontal aria-hidden size={18} />
        {t("filters.open")}
        {activeCount > 0 && <span className="rounded-full bg-primary px-2 text-sm text-white">{activeCount}</span>}
      </button>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => props.onChange(EMPTY_FILTERS)}
          className="min-h-11 px-3 font-bold text-primary underline underline-offset-2"
        >
          {t("filters.clear")}
        </button>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label={t("filters.open")}
        className="m-0 mt-auto max-h-[85vh] w-full max-w-none rounded-t-2xl bg-bg p-0 text-text backdrop:bg-text/40"
      >
        {/* Only rendered while open, so the page never has two copies of the filter controls */}
        {open && (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("filters.open")}</h2>
              <button
                type="button"
                onClick={hide}
                aria-label="Close filters"
                className="flex size-11 items-center justify-center rounded-lg border border-border bg-surface"
              >
                <X aria-hidden size={20} />
              </button>
            </div>
            <Filters {...props} />
            <button type="button" onClick={hide} className="min-h-11 w-full rounded-lg bg-primary font-bold text-white">
              {t("action.done")}
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
