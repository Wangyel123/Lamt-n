import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/auth";
import { Wordmark } from "./Wordmark";

// A quiet white bar: the name on the left, who you are and one action on the right.
// Demo mode shows a small "Demo" label instead of a banner.
export function TopBar({ profile }: { profile: Profile | null }) {
  const who = profile ? (profile.role === "supervisor" ? "Supervisor" : `Counsellor · ${profile.school ?? "All schools"}`) : null;
  return (
    <header className="sticky top-0 z-30 border-b border-separator bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-5">
        <Link href="/" aria-label="Lamtön, start page" className="inline-flex min-h-11 items-center">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-1 text-[14px]">
          {profile ? (
            <>
              <span className="hidden pr-3 text-text-muted sm:inline">{who}</span>
              <form action={signOut}>
                <button type="submit" className="min-h-11 rounded-[10px] px-3 font-medium text-text hover:bg-fill">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="rounded-md border border-separator px-2 py-0.5 text-[12px] font-medium text-text-muted">Demo</span>
              <Link href="/" className="inline-flex min-h-11 items-center rounded-[10px] px-3 font-medium text-text hover:bg-fill">
                Switch role
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
