"use client";

import { CalendarHeart, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useStudentCheckIns } from "@/lib/useStudentCheckIns";
import { useStudentId } from "@/lib/useStudentId";

// Shown on the student home only when the counsellor has sent a check-in that is still waiting.
export function CheckInTile({ liveStudentId }: { liveStudentId?: string }) {
  const studentId = useStudentId(liveStudentId);
  return studentId ? <Tile studentId={studentId} /> : null;
}

function Tile({ studentId }: { studentId: string }) {
  const { pending } = useStudentCheckIns(studentId);
  if (pending.length === 0) return null;
  return (
    <li>
      <Link href="/student/checkin" className="flex min-h-12 items-center gap-4 rounded-[18px] border border-separator bg-surface p-5 ring-2 ring-student-accent">
        <span aria-hidden className="flex shrink-0 text-student-accent">
          <CalendarHeart size={22} strokeWidth={1.75} />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Your counsellor sent a quick check-in</span>
          <span className="text-[16px] text-text-muted">About 1 minute. You can skip any question.</span>
        </span>
        <ChevronRight aria-hidden className="text-border" />
      </Link>
    </li>
  );
}
