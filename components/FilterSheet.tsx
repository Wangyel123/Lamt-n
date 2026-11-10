"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Filters as FilterValues } from "@/lib/filters";
import { FilterPickers } from "./Filters";

interface Props {
  filters: FilterValues;
  schools: string[];
  classes: string[];
  onChange: (filters: FilterValues) => void;
}

// Phones only: one "Filter" button instead of three pickers keeps the small screen calm
// (Hick's Law). The pickers open in a bottom sheet, within thumb reach.
// Native <dialog>: focus trap and Escape-to-close for free.
export function FilterSheet(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const count = [props.filters.school, props.filters.className, props.filters.status].filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-separator-strong bg-surface px-3 text-[14px] font-medium sm:hidden"
      >
        <SlidersHorizontal aria-hidden size={16} />
        Filter
        {count > 0 && <span className="tabular text-[13px] text-primary">{count}</span>}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label="Filter"
        className="m-0 mt-auto max-h-[85vh] w-full max-w-none rounded-t-[20px] bg-surface p-0 text-text backdrop:bg-black/30"
      >
        {/* Only rendered while open, so the page never has two copies of the pickers */}
        {open && (
          <div className="space-y-4 p-4 pb-8">
            <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-separator" />
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Filter</h2>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close filters"
                className="flex size-11 items-center justify-center rounded-[10px] hover:bg-fill"
              >
                <X aria-hidden size={18} />
              </button>
            </div>
            <FilterPickers {...props} layout="stack" />
            <button type="button" onClick={() => dialogRef.current?.close()} className="min-h-12 w-full rounded-[10px] bg-primary font-medium text-white hover:bg-primary-hover">
              Done
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
