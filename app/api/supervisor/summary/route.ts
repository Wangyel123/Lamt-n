// Supervisor API: returns ONLY aggregated, already-suppressed counts.
// The browser never receives student rows, IDs, answers or comments from here.
// (Phase 5: in live mode this checks the user is a signed-in supervisor first.)

import { loadStudentsFromCsv } from "@/lib/loadStudents";
import { buildSupervisorSummary } from "@/lib/supervisorSummary";

export async function GET() {
  const { students } = await loadStudentsFromCsv();
  return Response.json(buildSupervisorSummary(students));
}
