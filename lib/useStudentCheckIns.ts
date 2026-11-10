"use client";

// The check-ins waiting for one student. Live mode: the database only returns check-ins for the
// student's own group. Demo mode: we ask the server for the demo student's school/class once.

import { useEffect, useState } from "react";
import { demoStudentGroup } from "@/app/actions/demo";
import { pendingCheckIns, type CheckIn } from "./checkins";
import { isDemoMode } from "./mode";
import { checkInResponses, checkIns } from "./stores";

export function useStudentCheckIns(studentId: string): { pending: CheckIn[]; ready: boolean } {
  const sent = checkIns.use();
  const answers = checkInResponses.use();
  const [group, setGroup] = useState<{ school: string; className: string } | null | undefined>(isDemoMode() ? undefined : null);

  useEffect(() => {
    if (isDemoMode()) void demoStudentGroup(studentId).then((g) => setGroup(g));
  }, [studentId]);

  if (!sent.ready || !answers.ready || group === undefined) return { pending: [], ready: false };
  const answered = new Set(answers.items.filter((r) => r.studentId === studentId).map((r) => r.checkInId));
  const pending = group
    ? pendingCheckIns(sent.items, answers.items, studentId, group.school, group.className)
    : sent.items.filter((c) => !answered.has(c.id)); // live: already filtered to the student's group by RLS
  return { pending, ready: true };
}
