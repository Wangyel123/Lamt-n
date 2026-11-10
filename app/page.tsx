import { ArrowRight, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Wordmark } from "@/components/Wordmark";
import { getCurrentProfile } from "@/lib/auth";
import { isEnabled } from "@/lib/features";
import { isDemoMode } from "@/lib/mode";
import { ui } from "@/lib/ui";

// Start page: sign in (live mode) or choose a role (demo mode). One calm column, nothing else.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-5 py-16 outline-none">
        <Wordmark size="lg" />
        <p className="mt-6 text-[17px] leading-snug text-text-muted">
          Wellbeing follow-up for school counsellors. See who needs you first, and keep track of every conversation.
        </p>
        <div className="mt-10">
          {isDemoMode() ? (
            <RoleChooser />
          ) : (
            // Reading the login cookie is per-request, so it streams in behind a Suspense boundary.
            <Suspense fallback={<p role="status" className={ui.muted}>Loading…</p>}>
              <LiveLogin />
            </Suspense>
          )}
        </div>
        {/* Always shown, in every mode, with no sign-in: help must never sit behind a login. */}
        <Link href="/help" className="mt-10 flex items-center gap-3 rounded-[14px] border border-separator bg-surface px-5 py-4 transition-colors duration-150 hover:bg-fill">
          <LifeBuoy aria-hidden size={20} className="shrink-0 text-student-accent" />
          <span className="flex-1">
            <span className="block font-medium">Need help right now?</span>
            <span className="text-[14px] text-text-muted">Call the PEMA Helpline, 1098. Free, private, day and night.</span>
          </span>
          <ArrowRight aria-hidden size={18} className="text-text-muted" />
        </Link>
      </main>
      <footer className="px-5 pb-8 text-center text-[13px] text-text-muted">Prototype · synthetic data only · no real student is shown</footer>
    </div>
  );
}

async function LiveLogin() {
  const profile = await getCurrentProfile();
  if (profile) redirect(`/${profile.role}`); // already signed in
  return (
    <>
      <h1 className="mb-5 text-[20px] font-semibold tracking-[-0.01em]">Sign in</h1>
      <LoginForm />
      {isEnabled("studentPortal") && (
        <Link href="/student" className={`${ui.ghost} mt-6 -ml-3`}>
          I&apos;m a student, I have a code <ArrowRight aria-hidden size={16} />
        </Link>
      )}
    </>
  );
}

function RoleChooser() {
  const roles = [
    { href: "/counsellor", title: "Counsellor", text: "See who to meet first and track follow-ups" },
    { href: "/supervisor", title: "Supervisor", text: "Numbers for each school, never names" },
    ...(isEnabled("studentPortal") ? [{ href: "/student", title: "Student", text: "A private space to talk to your counsellor" }] : []),
  ];
  return (
    <>
      <h1 className="mb-4 text-[20px] font-semibold tracking-[-0.01em]">Continue as</h1>
      <ul className={`${ui.panel} divide-y divide-separator overflow-hidden`}>
        {roles.map(({ href, title, text }) => (
          <li key={href}>
            <Link href={href} className="group flex min-h-11 items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-fill">
              <span className="flex-1">
                <span className="block font-medium">{title}</span>
                <span className="text-[14px] text-text-muted">{text}</span>
              </span>
              <ArrowRight aria-hidden size={18} className="text-text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-text-muted">Demo mode: made-up students, and anything you change stays in this browser.</p>
    </>
  );
}
