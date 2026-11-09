// The ONE place that decides demo vs live mode.
// Demo mode: no Supabase env vars, so reviewers can run `npm install && npm run dev`
// with zero setup. Data comes from the CSV; follow-ups live in localStorage.
// Live mode: Supabase env vars present, so real login, Postgres and RLS.
// `npm run dev:demo` forces demo mode even when .env.local has Supabase keys.

export type AppMode = "demo" | "live";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supabase's newer "publishable" key replaces the older "anon" key; accept either.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function getMode(): AppMode {
  if (process.env.NEXT_PUBLIC_FORCE_DEMO === "true") return "demo";
  return SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY ? "live" : "demo";
}

export const isDemoMode = () => getMode() === "demo";
