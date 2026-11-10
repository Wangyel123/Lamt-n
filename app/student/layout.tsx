import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mark } from "@/components/Wordmark";
import { GetHelpSheet } from "@/components/student/GetHelpSheet";
import { LeaveButton } from "@/components/student/StudentSessionControls";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";

export const metadata: Metadata = { title: "My Wellbeing Space" };

// The student area's frame. Different on purpose from the counsellor screens:
//   * soft sage background, green accent, NO red anywhere (calm, never alarming);
//   * 18px text and 48px tap targets for younger readers (from class IV);
//   * "Get help now" and "Leave" on every screen. "Leave" matters on shared school devices.
// Switched off entirely by FEATURES.studentPortal in lib/features.ts.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  if (!isEnabled("studentPortal")) notFound();

  return (
    <div className="min-h-screen bg-student-bg text-[18px]">
      <header className="sticky top-0 z-30 border-b border-separator bg-student-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-2xl items-center justify-between gap-2 px-4">
          <Link href="/student" className="inline-flex min-h-12 shrink-0 items-center gap-2 font-semibold">
            <Mark size={28} tone="student" />
            <span className="tracking-[-0.02em] max-[419px]:sr-only">My space</span>
          </Link>
          <div className="flex items-center gap-1">
            <GetHelpSheet />
            <LeaveButton mode={isDemoMode() ? "demo" : "live"} />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl px-4 py-8 outline-none">
        {children}
      </main>
    </div>
  );
}
