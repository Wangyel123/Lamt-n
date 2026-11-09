import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountBar } from "@/components/AccountBar";
import { CounsellorBoard } from "@/components/CounsellorBoard";
import { DemoBanner } from "@/components/DemoBanner";
import { LoadingState } from "@/components/LoadingState";
import { requireRole } from "@/lib/auth";
import { loadStudentsForCounsellor, loadStudentsFromCsv } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";
import { T } from "@/components/T";

export const metadata: Metadata = { title: "Counsellor board · SA Wellbeing" };

// The page shell renders immediately; the data part streams in (it needs the login cookie in live mode).
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

  return (
    <>
      {profile ? <AccountBar profile={profile} /> : <DemoBanner />}
      <main id="main" tabIndex={-1} className="outline-none mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">
            <T k="board.title" />
          </h1>
          <p className="mt-1 max-w-prose text-sm text-text-muted">
            <T k="board.screening" />
          </p>
        </header>
        <CounsellorBoard students={students} report={report} />
      </main>
    </>
  );
}
