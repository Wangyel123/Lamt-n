"use client";

import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  studentIds: string[];
  onOpen: (studentId: string) => void;
  help?: string;
}

// A safety alert (e.g. "Overdue: urgent, no contact logged"). Quiet surface, one thin red edge,
// a red title in words, and one link per student. Red is used only for safety.
export function AlertBanner({ title, studentIds, onOpen, help }: Props) {
  if (studentIds.length === 0) return null;
  return (
    <div role="alert" className="relative overflow-hidden rounded-[14px] border border-separator bg-surface py-4 pr-4 pl-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-urgent" />
      <p className="text-[15px] font-semibold text-urgent-ink">{title}</p>
      {help && <p className="mt-0.5 text-[14px] text-text-muted">{help}</p>}
      <div className="mt-2 -ml-3 flex flex-wrap">
        {studentIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpen(id)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 font-mono text-[14px] font-medium text-text hover:bg-fill"
          >
            Open {id} <ArrowRight aria-hidden size={14} className="text-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
