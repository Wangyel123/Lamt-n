import type { Metadata } from "next";
import { Suspense } from "react";
import { CounsellorBoard } from "@/components/CounsellorBoard";
import { LoadingState } from "@/components/LoadingState";
import { TopBar } from "@/components/TopBar";
import { requireRole } from "@/lib/auth";
import { DEMO_SURVEY_LOADED_AT } from "@/lib/interventions";
import { loadStudentsForCounsellor, loadStudentsFromCsv, loadSurveyDate } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";

export const metadata: Metadata = { title: "Students to see · Student Wellbeing" };

// The page shell renders immediately; the data streams in (it needs the login cookie in live mode).
export default function CounsellorPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading students…" />}>
      <CounsellorContent />
    </Suspense>
  );
}

// Server component: loads students on the server, then hands clean rows to the interactive board.
//   Demo: the CSV.   Live: Supabase, as the logged-in counsellor, so RLS limits it to their school.
async function CounsellorContent() {
  const demo = isDemoMode();
  const profile = demo ? null : await requireRole("counsellor");
  const { students, report } = demo ? await loadStudentsFromCsv() : await loadStudentsForCounsellor();
  const flaggedSince = demo ? DEMO_SURVEY_LOADED_AT : await loadSurveyDate();

  return (
    <>
      <TopBar profile={profile} />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl space-y-6 px-5 py-10 outline-none">
        <header>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">Students to see</h1>
          <p className="mt-1 text-[14px] text-text-muted">From this year&apos;s wellbeing survey. Flags help you choose who to see first; they are not a diagnosis.</p>
        </header>
        <CounsellorBoard students={students} report={report} flaggedSince={flaggedSince} />
      </main>
    </>
  );
}
