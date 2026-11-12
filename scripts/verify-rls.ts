// npm run verify:rls: proves the database privacy rules work by logging in as each demo
// account (with the PUBLIC key, exactly like the browser) and trying things that must fail.
// Prints only counts and PASS/FAIL, never student data. Cleans up the one test write it makes.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateCode } from "../lib/accessCodes";

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

/**
 * Row count a client can see. "Permission denied" counts as 0 visible rows, but a MISSING table
 * returns -1 so the check fails loudly instead of passing by accident.
 * (Not a HEAD request: HEAD responses have no body, so they hide "table not found" errors.)
 */
async function visible(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client.from(table).select("*", { count: "exact" }).range(0, 0);
  if (error?.code === "PGRST205" || error?.code === "42P01") return -1; // table doesn't exist
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

  // 6. Phase 2: students signing in with code + PIN (needs migrations 002 + 004 + anonymous sign-ins)
  await studentChecks(admin, counsellorB, supervisor);
  // 7. Phase 2 features (needs migration 003 too)
  await phase2Checks(admin, counsellorB, supervisor);

  console.log(failures === 0 ? "\nAll RLS checks passed." : `\n${failures} RLS check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

async function studentChecks(admin: SupabaseClient, counsellorB: SupabaseClient, supervisor: SupabaseClient) {
  const { error: missing } = await admin.from("access_codes").select("code").limit(1); // not HEAD: it would hide the error
  if (missing) return console.log("SKIP  student checks: run supabase/migrations/002_student_access.sql first");
  const { error: noPins } = await admin.from("access_codes").select("pin_set_at").limit(1);
  if (noPins) return console.log("SKIP  student checks: run supabase/migrations/004_student_keys.sql first");
  const probe = newClient();
  const { data: probeUser, error: anonOff } = await probe.auth.signInAnonymously();
  if (anonOff) return console.log("SKIP  student checks: turn on Authentication → Sign In / Providers → Allow anonymous sign-ins");

  const codes: string[] = [];
  const anonIds: string[] = [probeUser.user!.id];
  const { data: me } = await counsellorB.auth.getUser();
  const makeCode = async (studentId: string) => {
    const code = generateCode();
    const res = await counsellorB.from("access_codes").insert({ code, student_id: studentId, created_by: me.user!.id });
    if (!res.error) codes.push(code);
    return { code, error: res.error };
  };
  const anonStudent = async () => {
    const c = newClient();
    const { data } = await c.auth.signInAnonymously();
    anonIds.push(data.user!.id);
    return c;
  };

  try {
    const good = await makeCode("S-038");
    check("School B counsellor CAN make a code for a School B student", !good.error);
    check("School B counsellor cannot make a code for a School A student", Boolean((await makeCode("S-001")).error));
    check("supervisor sees 0 access codes", (await visible(supervisor, "access_codes")) === 0);

    const signIn = async (c: SupabaseClient, code: string, pin: string) => (await c.rpc("sign_in_with_code", { p_code: code, p_pin: pin })).data;
    check("student: a wrong code is refused", (await signIn(probe, "ZZ-ZZZZ", "2580")) === "invalid_code");
    const student = await anonStudent();
    check("student: a too-easy first PIN (1234) is refused", (await signIn(student, good.code, "1234")) === "weak_pin");
    check("student: first time, code + their own PIN works", (await signIn(student, good.code, "2580")) === "ok_new");
    const { data: link } = await student.from("student_accounts").select("student_id");
    check("student: sees only their own link (S-038)", link?.length === 1 && link[0].student_id === "S-038");
    for (const table of ["students", "follow_ups", "follow_up_events", "access_codes", "code_pins"]) {
      check(`student: sees 0 rows in ${table} (never flags or counsellor notes)`, (await visible(student, table)) === 0);
    }
    const second = await anonStudent();
    check("a wrong PIN is refused (same answer as a wrong code)", (await signIn(second, good.code, "1111")) === "invalid_code");
    check("coming back: the same code + PIN works again, on another device", (await signIn(second, good.code, "2580")) === "ok");
    check("a staff account can't use a student code", (await signIn(counsellorB, good.code, "2580")) === "not_anonymous");
    check("counsellor can't read PINs (not even hashes)", (await visible(counsellorB, "code_pins")) === 0);
    check("counsellor sees the key is set up (no PIN)", (await counsellorB.from("access_codes").select("pin_set_at").eq("code", good.code)).data?.[0]?.pin_set_at != null);
    await counsellorB.from("access_codes").update({ revoked_at: new Date().toISOString() }).eq("code", good.code);
    check("stopping a code signs out every device that used it", ((await student.from("student_accounts").select("student_id")).data?.length ?? 1) === 0 && ((await second.from("student_accounts").select("student_id")).data?.length ?? 1) === 0);

    const revoked = await makeCode("S-039");
    await counsellorB.from("access_codes").update({ revoked_at: new Date().toISOString() }).eq("code", revoked.code);
    const third = await anonStudent();
    check("a revoked code doesn't work", (await signIn(third, revoked.code, "2580")) === "invalid_code");
  } finally {
    // Clean up everything this check created (secret key bypasses RLS).
    if (codes.length) await admin.from("access_codes").delete().in("code", codes);
    await admin.from("student_accounts").delete().in("auth_uid", anonIds);
    await admin.from("code_attempts").delete().in("auth_uid", anonIds);
    for (const id of anonIds) await admin.auth.admin.deleteUser(id);
  }
}

async function phase2Checks(admin: SupabaseClient, counsellorB: SupabaseClient, supervisor: SupabaseClient) {
  const { error: missing } = await admin.from("messages").select("id").limit(1);
  if (missing) return console.log("SKIP  Phase 2 checks: run supabase/migrations/003_phase2_features.sql first");
  const tables = ["interventions", "messages", "journal_entries", "goals", "checkins", "checkin_responses", "text_reviews", "board_posts"];
  for (const t of tables) check(`supervisor sees 0 rows in ${t}`, (await visible(supervisor, t)) === 0);

  const { data: me } = await counsellorB.auth.getUser();
  const ids: { table: string; id: string }[] = [];
  const anonIds: string[] = [];
  const codes: string[] = [];
  const studentFor = async (studentId: string) => {
    const code = generateCode();
    await counsellorB.from("access_codes").insert({ code, student_id: studentId, created_by: me.user!.id });
    codes.push(code);
    const c = newClient();
    const { data, error } = await c.auth.signInAnonymously();
    if (error) return null;
    anonIds.push(data.user!.id);
    await c.rpc("sign_in_with_code", { p_code: code, p_pin: "2580" });
    return c;
  };
  try {
    const i1 = crypto.randomUUID();
    check("counsellor logs an intervention for their school", !(await counsellorB.from("interventions").insert({ id: i1, student_id: "S-038", type: "check_in_meeting", created_by: me.user!.id })).error);
    ids.push({ table: "interventions", id: i1 });
    check("counsellor can't log one for another school", Boolean((await counsellorB.from("interventions").insert({ student_id: "S-001", type: "other", created_by: me.user!.id })).error));

    const student = await studentFor("S-038");
    const other = await studentFor("S-039");
    if (!student || !other) return console.log("SKIP  Phase 2 student checks: turn on anonymous sign-ins");
    const m1 = crypto.randomUUID();
    check("student sends a message to their counsellor", !(await student.from("messages").insert({ id: m1, student_id: "S-038", sender_role: "student", body: "hello (RLS check)" })).error);
    ids.push({ table: "messages", id: m1 });
    check("student can't send as someone else", Boolean((await student.from("messages").insert({ student_id: "S-039", sender_role: "student", body: "x" })).error));
    check("student can't pretend to be the counsellor", Boolean((await student.from("messages").insert({ student_id: "S-038", sender_role: "counsellor", body: "x" })).error));
    check("another student can't read this conversation", (await other.from("messages").select("id").eq("id", m1)).data?.length === 0);
    check("counsellor can read it", (await counsellorB.from("messages").select("id").eq("id", m1)).data?.length === 1);
    check("nobody can edit a message's words", ((await counsellorB.from("messages").update({ body: "changed" }).eq("id", m1).select()).data?.length ?? 0) === 0);
    check("student sees 0 interventions (counsellor notes)", (await visible(student, "interventions")) === 0);

    const j1 = crypto.randomUUID();
    await student.from("journal_entries").insert({ id: j1, student_id: "S-038", body: "private thought (RLS check)", shared: false });
    ids.push({ table: "journal_entries", id: j1 });
    check("counsellor CANNOT read a private journal entry", (await counsellorB.from("journal_entries").select("id").eq("id", j1)).data?.length === 0);
    await student.from("journal_entries").update({ shared: true }).eq("id", j1);
    check("…but can once the student shares it", (await counsellorB.from("journal_entries").select("id").eq("id", j1)).data?.length === 1);
    check("a journal entry's words can't be edited", ((await student.from("journal_entries").update({ body: "changed" }).eq("id", j1).select()).data?.length ?? 0) === 0);

    check("a student can't publish a board post directly", Boolean((await student.from("board_posts").insert({ student_id: "S-038", topic: "Friendships", body: "hi", alias: "Blue Lake", status: "approved" })).error));
  } finally {
    for (const { table, id } of ids) await admin.from(table).delete().eq("id", id);
    if (codes.length) await admin.from("access_codes").delete().in("code", codes);
    await admin.from("student_accounts").delete().in("auth_uid", anonIds);
    for (const id of anonIds) await admin.auth.admin.deleteUser(id);
  }
}

main().catch((err: Error) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
