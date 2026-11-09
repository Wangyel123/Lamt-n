import { UserRound, Users } from "lucide-react";
import Link from "next/link";
import { DemoBanner } from "@/components/DemoBanner";

// Demo mode role chooser. (Phase 5: live mode shows a login form here instead.)
export default function Home() {
  return (
    <>
      <DemoBanner />
      <main className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="text-3xl font-bold">SA Wellbeing — Counsellor Board</h1>
        <p className="mt-2 max-w-prose text-text-muted">
          A prototype to help school counsellors decide who to meet first and keep track of follow-ups. It uses
          synthetic data only. No real student is shown.
        </p>

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
            <div
              aria-disabled="true"
              className="flex min-h-11 items-center gap-3 rounded-lg border border-dashed border-border p-4 text-text-muted"
            >
              <Users aria-hidden />
              <span>
                <span className="block font-bold">View as supervisor</span>
                <span className="text-sm">Counts by school and class, no student identities (coming next)</span>
              </span>
            </div>
          </li>
        </ul>
      </main>
    </>
  );
}
