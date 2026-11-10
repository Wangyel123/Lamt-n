import { BarChart3, ChevronRight, HeartHandshake, Sprout, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentProfile } from "@/lib/auth";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";

// Start page: choose a role (demo mode) or sign in (live mode).
export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 outline-none">
      <div className="mb-8 text-center">
        <span aria-hidden className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[18px] bg-primary text-white shadow-[0_4px_6px_hsla(0,0%,0%,.1)]">
          <HeartHandshake size={32} />
        </span>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Student Wellbeing</h1>
        <p className="mx-auto mt-2 max-w-sm text-text-muted">
          Helps school counsellors see which students may need support first, from this year&apos;s wellbeing survey.
        </p>
      </div>

      {isDemoMode() ? (
        <RoleChooser />
      ) : (
        // Reading the login cookie is per-request, so it streams in behind a Suspense boundary.
        <Suspense fallback={<p role="status" className="text-center text-text-muted">Loading…</p>}>
          <LiveLogin />
        </Suspense>
      )}
    </main>
  );
}

async function LiveLogin() {
  const profile = await getCurrentProfile();
  if (profile) redirect(`/${profile.role}`); // already signed in
  return (
    <>
      <LoginForm />
      {isEnabled("studentPortal") && (
        <p className="mt-6 text-center text-[15px] text-text-muted">
          Are you a student?{" "}
          <Link href="/student" className="font-medium text-primary underline-offset-2 hover:underline">
            Go to your space
          </Link>
        </p>
      )}
    </>
  );
}

function RoleChooser() {
  const roles = [
    { href: "/counsellor", icon: UserRound, title: "I'm a counsellor", text: "See which students to meet first and track follow-ups" },
    { href: "/supervisor", icon: BarChart3, title: "I'm a supervisor", text: "See numbers for each school. No names." },
    // Phase 2 (K-01/K-05): the student area, shown only when its feature switch is on
    ...(isEnabled("studentPortal")
      ? [{ href: "/student", icon: Sprout, title: "I'm a student", text: "A private space to check in with your counsellor" }]
      : []),
  ];
  return (
    <>
      <ul className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
        {roles.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-11 items-center gap-3 px-4 py-4 hover:bg-bg/60">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill text-primary">
                <Icon size={18} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="text-[15px] text-text-muted">{text}</span>
              </span>
              <ChevronRight aria-hidden size={18} className="text-border" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[13px] text-text-muted">
        This demo uses made-up students. Anything you change is saved only in this browser.
      </p>
    </>
  );
}
