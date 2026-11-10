"use client";

import { useDemoStudent } from "@/lib/studentSession";
import { CodeForm } from "./CodeForm";
import { IdleSignOut } from "./StudentSessionControls";
import { StudentHome } from "./StudentHome";

// Demo mode: the "session" lives in this browser. Signed in → home; otherwise → code form.
export function DemoStudentGate() {
  const studentId = useDemoStudent();
  if (studentId === undefined) return <p role="status" className="text-text-muted">Loading…</p>;
  if (!studentId) return <CodeForm mode="demo" />;
  return (
    <>
      <StudentHome />
      <IdleSignOut mode="demo" />
    </>
  );
}
