// SERVER ONLY: where student data comes from in each mode.
// Importing this from a client component would fail the build (no file system,
// no cookies in the browser). That is intentional.

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { InterventionType } from "./interventions";
import { parseCsv, type ParseResult } from "./parseCsv";
import { fromDbRows, type StudentDbRow } from "./studentRecords";
import { getAdminSupabase, getServerSupabase } from "./supabase/server";

export const CSV_PATH = path.join(process.cwd(), "data", "SA_sample_dataset_SYNTHETIC.csv");

/** Demo mode: the synthetic CSV on disk. */
export async function loadStudentsFromCsv(): Promise<ParseResult> {
  // The demo CSV never changes while the app runs, so Next.js can cache the parsed
  // result and prerender the page (required because cacheComponents is on).
  "use cache";
  const text = await readFile(CSV_PATH, "utf8");
  return parseCsv(text);
}

/** Live mode, as the logged-in counsellor: RLS returns only students they may see. */
export async function loadStudentsForCounsellor(): Promise<ParseResult> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("students").select("*");
  if (error) throw new Error("Could not load students."); // no details: never echo data in errors
  return fromDbRows(data as StudentDbRow[]);
}

/** Live mode: when the survey results were loaded (the moment students were flagged). */
export async function loadSurveyDate(): Promise<string> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("students").select("imported_at").order("imported_at", { ascending: false }).limit(1);
  return (data?.[0]?.imported_at as string | undefined) ?? new Date().toISOString();
}

/**
 * Live mode, for the supervisor's COUNTS ONLY. Uses the secret key because supervisors have no
 * RLS access to student rows. Callers must check the role first and must only return
 * suppressed aggregates (buildSupervisorSummary). Comments are read here only so extra
 * rule E2 gives the same flags as on the counsellor board; they never leave the server.
 */
export async function loadStudentsForAggregation(): Promise<ParseResult> {
  const { data, error } = await getAdminSupabase().from("students").select("*");
  if (error) throw new Error("Could not load counts.");
  return fromDbRows(data as StudentDbRow[]);
}

/** Live mode, supervisor COUNTS ONLY: which students got which kind of support (no notes, no outcomes). */
export async function loadInterventionsForAggregation(): Promise<{ studentId: string; type: InterventionType }[]> {
  const { data, error } = await getAdminSupabase().from("interventions").select("student_id, type");
  if (error) return []; // table not created yet (migration 003): show nothing rather than fail
  return (data ?? []).map((r) => ({ studentId: r.student_id as string, type: r.type as InterventionType }));
}
