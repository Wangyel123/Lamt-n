"use server";

// Student sign-in with code + PIN, and sign-out (live mode). Server actions: the code and PIN are
// checked in Postgres by sign_in_with_code(); the browser never sees access_codes or any PIN.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPinShaped, messageFor, normaliseCode, OWN_DEVICE_DAYS, REDEEM_MESSAGES } from "@/lib/accessCodes";
import { OWN_DEVICE_COOKIE } from "@/lib/ownDevice";
import { getServerSupabase } from "@/lib/supabase/server";

export interface RedeemState {
  error: string | null;
}

export async function redeemCode(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const code = normaliseCode(String(formData.get("code") ?? ""));
  if (!code) return { error: REDEEM_MESSAGES.format };
  const pin = String(formData.get("pin") ?? "").trim();
  if (!isPinShaped(pin)) return { error: REDEEM_MESSAGES.pinFormat };

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

  const { data: result, error } = await supabase.rpc("sign_in_with_code", { p_code: code, p_pin: pin });
  const message = error ? REDEEM_MESSAGES.unavailable : messageFor(String(result));
  if (message) {
    // Don't leave an unused anonymous sign-in behind on a failed attempt (it keeps its attempt count).
    if (result !== "too_many_attempts") await supabase.auth.signOut();
    return { error: message };
  }

  // "This is my own phone": skip the idle sign-out on this device for a while (shared computers keep it).
  const jar = await cookies();
  if (formData.get("ownDevice") === "on") {
    jar.set(OWN_DEVICE_COOKIE, "1", { maxAge: OWN_DEVICE_DAYS * 24 * 60 * 60, sameSite: "lax", path: "/" });
  } else {
    jar.delete(OWN_DEVICE_COOKIE);
  }
  redirect(result === "ok_new" ? "/student?welcome=new" : "/student");
}

/** "Leave": signs out a student only. A staff account on the same device is never signed out from here. */
export async function signOutStudent(reason?: "idle") {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (data.user?.is_anonymous) await supabase.auth.signOut();
  (await cookies()).delete(OWN_DEVICE_COOKIE);
  redirect(reason === "idle" ? "/student?signedOut=idle" : "/");
}
