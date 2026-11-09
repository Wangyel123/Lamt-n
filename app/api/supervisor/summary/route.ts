// Supervisor API: returns ONLY aggregated, already-suppressed counts.
// The browser never receives student rows, IDs, answers or comments from here.

import { getCurrentProfile } from "@/lib/auth";
import { loadStudentsForAggregation, loadStudentsFromCsv } from "@/lib/loadStudents";
import { isDemoMode } from "@/lib/mode";
import { buildSupervisorSummary } from "@/lib/supervisorSummary";

export async function GET() {
  if (isDemoMode()) {
    const { students } = await loadStudentsFromCsv();
    return Response.json(buildSupervisorSummary(students));
  }

  // Live: only a signed-in supervisor, checked BEFORE the secret-key query runs.
  const profile = await getCurrentProfile();
  if (!profile) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (profile.role !== "supervisor") return Response.json({ error: "Supervisors only." }, { status: 403 });

  const { students } = await loadStudentsForAggregation();
  return Response.json(buildSupervisorSummary(students));
}
