import type { Metadata } from "next";
import Link from "next/link";
import { HelpContacts } from "@/components/HelpContacts";
import { Mark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Get help now" };

// PUBLIC on purpose: no sign-in, no code, no feature switch. Help in a crisis must never sit behind
// a login (see docs/RESEARCH.md). A short address a school can print on posters: /help
// Uses the student look: calm, 18px text, big tap targets, no red.
export default function HelpPage() {
  return (
    <div className="min-h-screen bg-student-bg text-[18px]">
      <header className="border-b border-separator">
        <div className="mx-auto flex min-h-16 max-w-2xl items-center px-4">
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-semibold tracking-[-0.02em]">
            <Mark size={28} tone="student" /> Lamtön
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 outline-none">
        <header className="space-y-2">
          <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Get help now</h1>
          <p className="text-text-muted">
            You don&apos;t need a code or an account. If you feel unsafe or very upset, you can reach someone right now, day or night.
          </p>
        </header>
        <HelpContacts />
        <p className="text-[16px] text-text-muted">
          Reaching out is a strong thing to do. You don&apos;t have to be sure what is wrong, or have the right words.
        </p>
      </main>
    </div>
  );
}
