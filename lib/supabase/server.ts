// Supabase clients for the SERVER only (server components, route handlers, server actions).

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../mode";

/** Acts AS the logged-in user (session from cookies). Row Level Security applies. */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server components can't set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

/**
 * BYPASSES Row Level Security. Use ONLY on the server, ONLY after checking the user's role,
 * and ONLY to produce suppressed aggregates (supervisor view) or to seed demo data.
 *
 * WARNING: SUPABASE_SECRET_KEY must never get a NEXT_PUBLIC_ prefix or be imported into
 * client code. Next.js only sends NEXT_PUBLIC_ variables to the browser, so here it stays
 * on the server.
 */
export function getAdminSupabase() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set (server-only).");
  return createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
