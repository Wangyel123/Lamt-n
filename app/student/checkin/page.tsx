import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentCheckIn } from "@/components/student/StudentCheckIn";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";
import { requireLiveStudent } from "@/lib/studentPage";

export const metadata: Metadata = { title: "Check-in · My Wellbeing Space" };

// P-04: switched off entirely by FEATURES.checkIns.
export default function CheckInPage() {
  if (!isEnabled("checkIns")) notFound();
  if (isDemoMode()) return <StudentCheckIn />;
  return (
    <Suspense fallback={<p role="status" className="text-text-muted">Loading…</p>}>
      <Live />
    </Suspense>
  );
}

async function Live() {
  return <StudentCheckIn liveStudentId={await requireLiveStudent("checkIns")} />;
}
