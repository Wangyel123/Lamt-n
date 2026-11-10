// SERVER ONLY: is a student signed in (live mode)?
// A student is an ANONYMOUS Supabase user who has redeemed a code (a row in student_accounts).

import { connection } from "next/server";
import { getServerSupabase } from "./supabase/server";

export async function getStudentSession(): Promise<{ studentId: string } | null> {
  await connection(); // per-request: never prerender who is signed in
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.is_anonymous) return null; // staff accounts are never treated as students
  // RLS: a student can read only their own link.
  const { data: link } = await supabase.from("student_accounts").select("student_id").eq("auth_uid", data.user.id).maybeSingle();
  return link ? { studentId: link.student_id } : null;
}
