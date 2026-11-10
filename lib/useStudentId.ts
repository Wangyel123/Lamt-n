"use client";

// Which student is using the student area: live mode passes the id from the server session;
// demo mode reads the demo sign-in from this browser.
// Returns undefined while loading, null if nobody is signed in.

import { useDemoStudent } from "./studentSession";

export function useStudentId(liveStudentId?: string): string | null | undefined {
  const demo = useDemoStudent();
  return liveStudentId ?? demo;
}
