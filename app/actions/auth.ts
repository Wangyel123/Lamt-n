"use server";

// Login and logout (live mode). Server actions: the password goes straight to the server,
// and Supabase sets the session cookie there.

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export interface SignInState {
  error: string | null;
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // One message for every failure, so nobody can probe which emails have accounts.
  if (error || !data.user) return { error: "Email or password is not correct." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account has no role yet. Please contact CECD." };
  }
  redirect(profile.role === "supervisor" ? "/supervisor" : "/counsellor");
}

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
