"use server";

// Student sign-in with a code, and sign-out (live mode). Server actions: the code is checked in
// Postgres by redeem_access_code(); the browser never sees access_codes.

import { redirect } from "next/navigation";
import { normaliseCode, REDEEM_MESSAGES } from "@/lib/accessCodes";
import { getServerSupabase } from "@/lib/supabase/server";

export interface RedeemState {
  error: string | null;
}

export async function redeemCode(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const code = normaliseCode(String(formData.get("code") ?? ""));
  if (!code) return { error: REDEEM_MESSAGES.format };

  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (data.user && !data.user.is_anonymous) {
    // A staff member is signed in on this device: never mix a staff session with a student one.
    return { error: "A staff account is signed in on this device. Please sign out of it first." };
  }
  if (!data.user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return { error: REDEEM_MESSAGES.unavailable };
  }

  const { data: result, error } = await supabase.rpc("redeem_access_code", { p_code: code });
  if (error || result !== "ok") {
    // Don't leave an unused anonymous sign-in behind on a failed attempt (it keeps its attempt count).
    if (result !== "too_many_attempts") await supabase.auth.signOut();
    return { error: result === "too_many_attempts" ? REDEEM_MESSAGES.tooMany : error ? REDEEM_MESSAGES.unavailable : REDEEM_MESSAGES.invalid };
  }
  redirect("/student");
}

/** "Leave": signs out a student only. A staff account on the same device is never signed out from here. */
export async function signOutStudent(reason?: "idle") {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (data.user?.is_anonymous) await supabase.auth.signOut();
  redirect(reason === "idle" ? "/student?signedOut=idle" : "/");
}
