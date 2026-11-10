// SERVER ONLY: shared start for every live student feature page.
import { notFound, redirect } from "next/navigation";
import { isEnabled, type FeatureName } from "./features";
import { getStudentSession } from "./studentAuth";

/** Live mode: the signed-in student's id, or a redirect to the code page. Also checks the feature switch. */
export async function requireLiveStudent(feature: FeatureName): Promise<string> {
  if (!isEnabled(feature)) notFound();
  const session = await getStudentSession();
  if (!session) redirect("/student");
  return session.studentId;
}
