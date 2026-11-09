// npm run verify:rls: proves the database privacy rules work by logging in as each demo
// account (with the PUBLIC key, exactly like the browser) and trying things that must fail.
// Prints only counts and PASS/FAIL, never student data. Cleans up the one test write it makes.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // variables may come from the shell instead
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COUNSELLOR_PW = process.env.DEMO_COUNSELLOR_PASSWORD ?? "Counsellor-Demo-2026";
const SUPERVISOR_PW = process.env.DEMO_SUPERVISOR_PASSWORD ?? "Supervisor-Demo-2026";
const MARKER = "automated RLS check";

let failures = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};

const newClient = () => createClient(url, publishable, { auth: { persistSession: false } });

async function signedIn(email: string, password: string): Promise<SupabaseClient> {
  const client = newClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Could not sign in as ${email}: ${error.message}. Did you run npm run seed?`);
  return client;
}

/** Row count a client can see (an error counts as 0 visible rows). */
async function visible(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  return error ? 0 : (count ?? 0);
}

async function main() {
  // 1. Not logged in
  const anon = newClient();
  check("not logged in: sees 0 students", (await visible(anon, "students")) === 0);
  check("not logged in: sees 0 follow-ups", (await visible(anon, "follow_ups")) === 0);

  // 2. Supervisor: must not reach ANY student-level row
  const supervisor = await signedIn("supervisor@demo.bt", SUPERVISOR_PW);
  check("supervisor: sees 0 students", (await visible(supervisor, "students")) === 0);
  check("supervisor: sees 0 follow-ups", (await visible(supervisor, "follow_ups")) === 0);
  check("supervisor: sees 0 follow-up history", (await visible(supervisor, "follow_up_events")) === 0);
  const supWrite = await supervisor.rpc("save_follow_up", { p_student_id: "S-001", p_status: "closed", p_note: "", p_event_note: MARKER });
  check("supervisor: cannot save a follow-up", Boolean(supWrite.error));
  const { data: ownProfile } = await supervisor.from("profiles").select("role");
  check("supervisor: can read only their own profile", ownProfile?.length === 1 && ownProfile[0].role === "supervisor");

  // 3. All-schools demo counsellor
  const counsellor = await signedIn("counsellor@demo.bt", COUNSELLOR_PW);
  check("counsellor (all schools): sees all 72 students", (await visible(counsellor, "students")) === 72);
  const roleChange = await counsellor.from("profiles").update({ role: "supervisor" }).select();
  check("counsellor: cannot change their own role", Boolean(roleChange.error) || roleChange.data?.length === 0);
  const studentEdit = await counsellor.from("students").update({ q6_thoughts_of_self_harm: "No" }).eq("student_id", "S-005").select();
  check("counsellor: cannot edit survey answers", Boolean(studentEdit.error) || studentEdit.data?.length === 0);

  // 4. School B counsellor: RLS limits them to their own school
  const counsellorB = await signedIn("counsellor.b@demo.bt", COUNSELLOR_PW);
  const { data: bRows } = await counsellorB.from("students").select("school");
  check(`School B counsellor: sees 23 students (got ${bRows?.length ?? 0})`, bRows?.length === 23);
  check("School B counsellor: every visible student is in School B", (bRows ?? []).every((r) => r.school === "School B"));
  const otherSchool = await counsellorB.rpc("save_follow_up", { p_student_id: "S-001", p_status: "in_progress", p_note: "", p_event_note: MARKER });
  check("School B counsellor: cannot save a follow-up for a School A student", Boolean(otherSchool.error));

  // 5. Own school write works, and the audit log can't be rewritten
  const admin = createClient(url, secret, { auth: { persistSession: false } });
  const { data: existing } = await admin.from("follow_ups").select("student_id").eq("student_id", "S-038");
  const ownSchool = await counsellorB.rpc("save_follow_up", { p_student_id: "S-038", p_status: "in_progress", p_note: "", p_event_note: MARKER });
  check("School B counsellor: CAN save a follow-up for a School B student", !ownSchool.error);
  const { data: events } = await counsellorB.from("follow_up_events").select("id").eq("student_id", "S-038").eq("note", MARKER);
  check("the status change was written to the audit log", (events?.length ?? 0) >= 1);
  const del = await counsellorB.from("follow_up_events").delete().eq("note", MARKER).select();
  check("audit log entries cannot be deleted", Boolean(del.error) || del.data?.length === 0);
  const edit = await counsellorB.from("follow_up_events").update({ note: "changed" }).eq("note", MARKER).select();
  check("audit log entries cannot be edited", Boolean(edit.error) || edit.data?.length === 0);

  // Clean up the test write (with the secret key, which bypasses RLS).
  await admin.from("follow_up_events").delete().eq("note", MARKER);
  if (!existing?.length) await admin.from("follow_ups").delete().eq("student_id", "S-038");

  console.log(failures === 0 ? "\nAll RLS checks passed." : `\n${failures} RLS check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err: Error) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
