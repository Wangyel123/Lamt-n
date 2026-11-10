import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentBoard } from "@/components/student/StudentBoard";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";
import { requireLiveStudent } from "@/lib/studentPage";

export const metadata: Metadata = { title: "Student board · My Wellbeing Space" };

// K-06: OFF by default (FEATURES.peerBoard). When off, this page doesn't exist.
export default function BoardPage() {
  if (!isEnabled("peerBoard")) notFound();
  if (isDemoMode()) return <StudentBoard />;
  return (
    <Suspense fallback={<p role="status" className="text-text-muted">Loading…</p>}>
      <Live />
    </Suspense>
  );
}

async function Live() {
  return <StudentBoard liveStudentId={await requireLiveStudent("peerBoard")} />;
}
