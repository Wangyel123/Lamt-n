"use client";

// Supabase client for the BROWSER. Uses the publishable key, which is safe to expose:
// every query still goes through Row Level Security as the logged-in user.

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../mode";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
