import type { Metadata } from "next";
import { CounsellorBoard } from "@/components/CounsellorBoard";
import { DemoBanner } from "@/components/DemoBanner";
import { loadStudentsFromCsv } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";

export const metadata: Metadata = { title: "Counsellor board · SA Wellbeing" };

// Server component: reads and parses the CSV on the server, then hands the
// clean rows to the interactive board. (Phase 5: live mode reads Supabase instead.)
export default async function CounsellorPage() {
  const { students, report } = await loadStudentsFromCsv();

  return (
    <>
      {isDemoMode() && <DemoBanner />}
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Counsellor board</h1>
          <p className="mt-1 max-w-prose text-sm text-text-muted">
            Flags are a screening aid to help you decide who to meet first. They are not a diagnosis. Your
            professional judgement comes first.
          </p>
        </header>
        <CounsellorBoard students={students} report={report} />
      </main>
    </>
  );
}
