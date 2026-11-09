import { UserRound, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DemoBanner } from "@/components/DemoBanner";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentProfile } from "@/lib/auth";
import { isDemoMode } from "@/lib/mode";

// Home: a role chooser in demo mode, a login form in live mode.
export default function Home() {
  return (
    <>
      {isDemoMode() && <DemoBanner />}
      <main className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="text-3xl font-bold">SA Wellbeing — Counsellor Board</h1>
        <p className="mt-2 max-w-prose text-text-muted">
          A prototype to help school counsellors decide who to meet first and keep track of follow-ups. It uses
          synthetic data only. No real student is shown.
        </p>
        {isDemoMode() ? (
          <RoleChooser />
        ) : (
          // Reading the login cookie is per-request, so it streams in behind a Suspense boundary.
          <Suspense fallback={<p className="mt-8 text-text-muted">Loading…</p>}>
            <LiveLogin />
          </Suspense>
        )}
      </main>
    </>
  );
}

async function LiveLogin() {
  const profile = await getCurrentProfile();
  if (profile) redirect(`/${profile.role}`); // already signed in
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">Sign in</h2>
      <LoginForm />
    </section>
  );
}

function RoleChooser() {
  return (
    <>
      <h2 className="mt-8 text-lg font-bold">Choose a role to explore</h2>
      <ul className="mt-3 space-y-3">
        <li>
          <Link
            href="/counsellor"
            className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary"
          >
            <UserRound aria-hidden className="text-primary" />
            <span>
              <span className="block font-bold">View as counsellor</span>
              <span className="text-sm text-text-muted">See each student&apos;s flag and record follow-ups</span>
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/supervisor"
            className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary"
          >
            <Users aria-hidden className="text-primary" />
            <span>
              <span className="block font-bold">View as supervisor</span>
              <span className="text-sm text-text-muted">Counts by school and class, no student identities</span>
            </span>
          </Link>
        </li>
      </ul>
    </>
  );
}
