// SERVER ONLY: who is logged in, and what role do they have? (live mode)

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getServerSupabase } from "./supabase/server";

export type Role = "counsellor" | "supervisor";

export interface Profile {
  userId: string;
  email: string;
  role: Role;
  school: string | null;
}

/** The logged-in user's profile, or null if not logged in (or no profile row). */
export async function getCurrentProfile(): Promise<Profile | null> {
  // Who is logged in is different on every request, so tell Next.js never to prerender this.
  // (Without it, Supabase's token-expiry check calls Date.now() and Next.js warns.)
  await connection();
  const supabase = await getServerSupabase();
  // getUser() asks Supabase to verify the token; never trust the cookie alone for access decisions.
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, school").eq("id", data.user.id).single();
  if (!profile) return null;
  return { userId: data.user.id, email: data.user.email ?? "", role: profile.role as Role, school: profile.school };
}

/** Use at the top of a protected page: sends the user to log in, or to their own page. */
export async function requireRole(role: Role): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  if (profile.role !== role) redirect(`/${profile.role}`);
  return profile;
}
