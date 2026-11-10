"use server";

// DEMO MODE ONLY: a demo student's school and class, so their check-ins can be shown.
// (In live mode the database's privacy rules already return only the student's own check-ins.)
// Returns just two words, never answers or flags.

import { loadStudentsFromCsv } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";

export async function demoStudentGroup(studentId: string): Promise<{ school: string; className: string } | null> {
  if (!isDemoMode()) return null;
  const { students } = await loadStudentsFromCsv();
  const s = students.find((x) => x.studentId === studentId);
  return s ? { school: s.school, className: s.className } : null;
}
