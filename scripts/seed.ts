// npm run seed: loads the SYNTHETIC CSV into Supabase and creates the demo accounts.
// Safe to run again (idempotent): students are upserted, existing users get their password reset.
//
// Uses the SECRET key (bypasses RLS), so it only ever runs on your machine, never in the browser.
// It never prints student data, only counts.

import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseCsv } from "../lib/parseCsv";
import { toDbRows } from "../lib/studentRecords";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fine: variables may come from the shell instead
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

// Demo accounts for reviewers. Synthetic data only, so the passwords are documented in the README.
// Override with env vars if you deploy somewhere more public.
const DEMO_USERS = [
  {
    email: "counsellor@demo.bt",
    password: process.env.DEMO_COUNSELLOR_PASSWORD ?? "Counsellor-Demo-2026",
    role: "counsellor",
    school: null, // all schools: demo only
  },
  {
    email: "counsellor.b@demo.bt",
    password: process.env.DEMO_COUNSELLOR_PASSWORD ?? "Counsellor-Demo-2026",
    role: "counsellor",
    school: "School B", // shows that RLS limits a counsellor to their own school
  },
  {
    email: "supervisor@demo.bt",
    password: process.env.DEMO_SUPERVISOR_PASSWORD ?? "Supervisor-Demo-2026",
    role: "supervisor",
    school: null,
  },
] as const;

async function seedStudents() {
  const csv = readFileSync(path.join(process.cwd(), "data", "SA_sample_dataset_SYNTHETIC.csv"), "utf8");
  const parsed = parseCsv(csv);
  // The database needs unique IDs. Rather than silently drop a duplicate, stop and say so.
  if (parsed.report.duplicates.length > 0) {
    throw new Error(`Duplicate student IDs in the CSV (${parsed.report.duplicates.join(", ")}). Fix the file first.`);
  }
  const { error } = await admin.from("students").upsert(toDbRows(parsed), { onConflict: "student_id" });
  if (error) throw new Error(`Saving students failed: ${error.message}`);
  console.log(`✓ ${parsed.students.length} students saved`);
}

async function findUserId(email: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Listing users failed: ${error.message}`);
    const user = data.users.find((u) => u.email === email);
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function seedUsers() {
  for (const u of DEMO_USERS) {
    let userId = await findUserId(u.email);
    if (userId) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password: u.password, email_confirm: true });
      if (error) throw new Error(`Updating ${u.email} failed: ${error.message}`);
    } else {
      // email_confirm: true, so no confirmation email is needed (these are not real inboxes).
      const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
      if (error) throw new Error(`Creating ${u.email} failed: ${error.message}`);
      userId = data.user.id;
    }
    const { error } = await admin.from("profiles").upsert({ id: userId, role: u.role, school: u.school });
    if (error) throw new Error(`Saving profile for ${u.email} failed: ${error.message}`);
    console.log(`✓ ${u.email} (${u.role}${u.school ? `, ${u.school}` : ""})`);
  }
}

seedStudents()
  .then(seedUsers)
  .then(() => console.log("Seed complete."))
  .catch((err: Error) => {
    console.error(`✗ ${err.message}`);
    if (/relation .* does not exist|Could not find the table/i.test(err.message)) {
      console.error("  → Run supabase/migrations/001_init.sql in the Supabase SQL Editor first.");
    }
    process.exit(1);
  });
