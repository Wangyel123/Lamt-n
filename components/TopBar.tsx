import { HeartHandshake, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/auth";

// One quiet, translucent bar at the top of every page (Apple style: the only "glass" is on this
// floating navigation layer, never on content). It says where you are and who you are, then gets
// out of the way. Demo mode shows a small "Sample data" pill instead of a loud banner.
export function TopBar({ profile }: { profile: Profile | null }) {
  const scope = profile
    ? profile.role === "supervisor"
      ? "Supervisor"
      : `Counsellor · ${profile.school ?? "All schools"}`
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-separator bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold">
          <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
            <HeartHandshake size={16} />
          </span>
          {/* Below 400px only the icon shows, so the bar fits the narrowest phones; the page title says where you are */}
          <span className="max-[399px]:sr-only">Student Wellbeing</span>
        </Link>

        <div className="flex items-center gap-1 text-[15px]">
          {profile ? (
            <>
              <span className="hidden pr-2 text-text-muted sm:inline">
                {profile.email} · {scope}
              </span>
              <form action={signOut}>
                <button type="submit" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-medium text-primary hover:bg-fill">
                  <LogOut aria-hidden size={16} /> Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="rounded-full bg-fill px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap text-text-muted">
                <span className="sm:hidden">Demo</span>
                <span className="hidden sm:inline">Sample data</span>
              </span>
              <Link href="/" className="inline-flex min-h-11 items-center rounded-full px-3 font-medium whitespace-nowrap text-primary hover:bg-fill">
                Switch role
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
