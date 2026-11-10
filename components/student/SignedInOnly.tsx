"use client";

import Link from "next/link";
import { useStudentId } from "@/lib/useStudentId";
import { IdleSignOut } from "./StudentSessionControls";

// Wraps every student feature page: shows it only to a signed-in student, keeps the idle sign-out
// running, and otherwise sends them to the code form. Live mode passes the id from the server.
export function SignedInOnly({ liveStudentId, children }: { liveStudentId?: string; children: (studentId: string) => React.ReactNode }) {
  const studentId = useStudentId(liveStudentId);
  if (studentId === undefined) return <p role="status" className="text-text-muted">Loading…</p>;
  if (!studentId)
    return (
      <div className="space-y-4 rounded-[18px] border border-separator bg-surface p-5">
        <p>Please type the code from your slip first.</p>
        <Link href="/student" className="inline-flex min-h-12 items-center rounded-[12px] bg-student-accent px-5 font-semibold text-white">
          Go to the code page
        </Link>
      </div>
    );
  return (
    <>
      {children(studentId)}
      <IdleSignOut mode={liveStudentId ? "live" : "demo"} />
    </>
  );
}
