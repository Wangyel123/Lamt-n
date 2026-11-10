"use client";

import { BookOpen, Check } from "lucide-react";
import { useState } from "react";
import { SOURCE_LABELS, type ReadingItem } from "@/lib/readingQueue";
import { KEYWORD_NOTICE } from "@/lib/sensitiveText";

/** The chip on a student's row: calm (not red), with the category in words. */
export function NeedsReadingChip({ categories }: { categories: string[] }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-review/25 px-1.5 text-[12px] font-medium text-review-ink">
      <BookOpen aria-hidden size={12} /> Needs reading: {categories.join(", ")}
    </span>
  );
}

// P-02, in the detail sheet: the words, why they matched, and "Mark as read".
// The counsellor decides what it means; nothing here changes a flag.
export function NeedsReadingList({ items, onMarkRead }: { items: ReadingItem[]; onMarkRead: (item: ReadingItem) => Promise<boolean> }) {
  const [error, setError] = useState(false);
  return (
    <div className="space-y-4 p-4">
      {items.map((item) => (
        <div key={item.sourceId} className="space-y-2">
          <p className="text-[13px] font-medium text-text-muted">{SOURCE_LABELS[item.source.kind]}</p>
          <blockquote className="border-l-4 border-review pl-3">&ldquo;{item.source.text}&rdquo;</blockquote>
          <ul className="text-[15px] text-text-muted">
            {item.matches.map((m) => (
              <li key={m.category}>
                {m.label} <span className="text-[13px]">(matched: {m.words.join(", ")})</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={async () => setError(!(await onMarkRead(item)))}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-separator-strong px-4 text-[15px] font-medium hover:bg-fill"
          >
            <Check aria-hidden size={16} /> Mark as read
          </button>
        </div>
      ))}
      {error && <p role="alert" className="text-[13px] font-semibold text-urgent-ink">Couldn&apos;t save. Try again.</p>}
      <p className="text-[13px] text-text-muted">{KEYWORD_NOTICE}</p>
    </div>
  );
}
