// Next.js 16 "proxy" (formerly middleware): runs before each page request.
// In live mode it refreshes the Supabase login session so pages see a valid user.
// In demo mode it does nothing.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./lib/mode";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (isDemoMode()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        // Stops CDNs caching a response that carries someone's session cookie.
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });
  await supabase.auth.getClaims(); // triggers the refresh if the token is near expiry
  return response;
}

export const config = {
  // Skip static files and images; only pages and API routes need the session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
