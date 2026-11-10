import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentJournal } from "@/components/student/StudentJournal";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";
import { requireLiveStudent } from "@/lib/studentPage";

export const metadata: Metadata = { title: "My journal · My Wellbeing Space" };

// K-04: switched off entirely by FEATURES.journal.
export default function JournalPage() {
  if (!isEnabled("journal")) notFound();
  if (isDemoMode()) return <StudentJournal />;
  return (
    <Suspense fallback={<p role="status" className="text-text-muted">Loading…</p>}>
      <Live />
    </Suspense>
  );
}

async function Live() {
  return <StudentJournal liveStudentId={await requireLiveStudent("journal")} />;
}
