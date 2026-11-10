import { ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { STUDENT_IDLE_MINUTES } from "@/lib/accessCodes";

// The signed-in student's home. It never shows a flag, a reason, or anything counsellor-only.
// Phase 2 adds tiles here (talk to my counsellor, check-in, activities, journal) as each is built,
// each behind its switch in lib/features.ts. At most 4 big tiles (Hick's law).
export function StudentHome() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">You&apos;re in</h1>
        <p className="text-text-muted">This is your private space. Your counsellor is here for you.</p>
      </header>

      <ul className="space-y-3">
        <li>
          <Link href="/student/about" className="flex min-h-12 items-center gap-4 rounded-3xl bg-surface p-5">
            <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-student-bg text-student-accent">
              <Info size={24} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">About this space</span>
              <span className="text-[16px] text-text-muted">What it is, what it isn&apos;t, and who can see what</span>
            </span>
            <ChevronRight aria-hidden className="text-border" />
          </Link>
        </li>
      </ul>

      <p className="text-[16px] text-text-muted">
        When you&apos;re done, tap &ldquo;Leave&rdquo;. If you forget, you&apos;ll be signed out after {STUDENT_IDLE_MINUTES} minutes.
      </p>
    </div>
  );
}
