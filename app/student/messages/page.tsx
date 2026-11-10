import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentMessages } from "@/components/student/StudentMessages";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";
import { requireLiveStudent } from "@/lib/studentPage";

export const metadata: Metadata = { title: "Talk to my counsellor · My Wellbeing Space" };

// K-02: switched off entirely by FEATURES.messaging.
export default function MessagesPage() {
  if (!isEnabled("messaging")) notFound();
  if (isDemoMode()) return <StudentMessages />;
  return (
    <Suspense fallback={<p role="status" className="text-text-muted">Loading…</p>}>
      <Live />
    </Suspense>
  );
}

async function Live() {
  return <StudentMessages liveStudentId={await requireLiveStudent("messaging")} />;
}
