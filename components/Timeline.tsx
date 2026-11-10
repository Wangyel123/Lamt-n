import { CalendarCheck, ClipboardList, MessageSquare, NotebookPen, RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { TimelineEntry } from "@/lib/timeline";

const ICONS = { status: RefreshCw, intervention: ClipboardList, message: MessageSquare, checkin: CalendarCheck, journal: NotebookPen };

// Everything that happened for one student, newest first (P-01). Message entries show WHEN only.
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className="text-[15px] text-text-muted">Nothing yet.</p>;
  return (
    <ol className="space-y-3">
      {entries.map((e, i) => {
        const Icon = ICONS[e.kind];
        return (
          <li key={`${e.at}-${i}`} className="flex gap-3">
            <Icon aria-hidden size={16} className="mt-1 shrink-0 text-text-muted" />
            <span className="text-[15px]">
              <span className="font-medium">{e.title}</span>
              <span className="text-text-muted"> · {formatTime(e.at)}</span>
              {e.detail && <span className="block text-text-muted">{e.detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
