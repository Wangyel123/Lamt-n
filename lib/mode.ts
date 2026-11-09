// The ONE place that decides demo vs live mode.
// Demo mode: no Supabase env vars, so reviewers can run `npm install && npm run dev`
// with zero setup. Data comes from the CSV; follow-ups live in localStorage.
// Live mode: Supabase env vars present, so real login, Postgres and RLS.

export type AppMode = "demo" | "live";

export function getMode(): AppMode {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return hasSupabase ? "live" : "demo";
}

export const isDemoMode = () => getMode() === "demo";
