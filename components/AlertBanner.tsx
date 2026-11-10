"use client";

import { OctagonAlert } from "lucide-react";

interface Props {
  title: string;
  studentIds: string[];
  onOpen: (studentId: string) => void;
  help?: string;
}

// A safety alert above the tabs (e.g. "Overdue: urgent, no contact logged"). Red is used only for
// safety, always with an icon and words. Each student is a button that opens their details.
export function AlertBanner({ title, studentIds, onOpen, help }: Props) {
  if (studentIds.length === 0) return null;
  return (
    <div role="alert" className="space-y-2 rounded-2xl border-l-4 border-urgent bg-urgent-tint p-4">
      <p className="flex items-center gap-2 font-semibold text-urgent-ink">
        <OctagonAlert aria-hidden size={18} />
        {title}
      </p>
      {help && <p className="text-[15px] text-text-muted">{help}</p>}
      <div className="flex flex-wrap gap-2">
        {studentIds.map((id) => (
          <button key={id} type="button" onClick={() => onOpen(id)} className="tabular min-h-11 rounded-full bg-surface px-4 font-semibold">
            Open {id}
          </button>
        ))}
      </div>
    </div>
  );
}
