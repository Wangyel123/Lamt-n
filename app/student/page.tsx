import { ChevronRight, Info, KeyRound } from "lucide-react";
import Link from "next/link";

// Student home (Step 1 shell). Step 2 adds signing in with the code a counsellor gives you.
// Words are kept short and plain (reading level about class IV–V).
export default function StudentHome() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">Welcome to your space</h1>
        <p className="text-text-muted">
          A private place to check in with your school counsellor. You never need to type your name.
        </p>
      </header>

      <ul className="space-y-3">
        <li>
          <Link href="/student/about" className="flex min-h-12 items-center gap-4 rounded-3xl bg-surface p-5">
            <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-student-bg text-student-accent">
              <Info size={24} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">About this space</span>
              <span className="text-[16px] text-text-muted">What it is, what it isn&apos;t, and who can see what</span>
            </span>
            <ChevronRight aria-hidden className="text-border" />
          </Link>
        </li>
        <li className="flex items-center gap-4 rounded-3xl bg-surface p-5">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-student-bg text-student-accent">
            <KeyRound size={24} />
          </span>
          <span>
            <span className="block font-semibold">Your code</span>
            <span className="text-[16px] text-text-muted">Your counsellor will give you a short code to get started.</span>
          </span>
        </li>
      </ul>
    </div>
  );
}
