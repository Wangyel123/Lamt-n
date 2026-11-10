import { Suspense } from "react";
import { CodeForm } from "@/components/student/CodeForm";
import { DemoStudentGate } from "@/components/student/DemoStudentGate";
import { IdleSignOut } from "@/components/student/StudentSessionControls";
import { StudentHome } from "@/components/student/StudentHome";
import { isDemoMode } from "@/lib/mode";
import { getStudentSession } from "@/lib/studentAuth";

// Student home: the code form until a code is redeemed, then the student's space.
export default function StudentPage() {
  if (isDemoMode()) return <DemoStudentGate />;
  return (
    // Who is signed in is per-request, so it streams in behind a Suspense boundary.
    <Suspense fallback={<p role="status" className="text-text-muted">Loading…</p>}>
      <LiveStudentGate />
    </Suspense>
  );
}

async function LiveStudentGate() {
  const session = await getStudentSession();
  if (!session) return <CodeForm mode="live" />;
  return (
    <>
      <StudentHome />
      <IdleSignOut mode="live" />
    </>
  );
}
