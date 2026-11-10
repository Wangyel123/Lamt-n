import { Check, Eye, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import { isEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "About this space · My Wellbeing Space" };

// K-05: honest, plain-language explanation (reading level about class IV–V).
// Being clear about what the tool is NOT, and about the limits of privacy, builds more
// trust than big promises. The "who can see what" list only shows features that are ON,
// so we never describe something that doesn't exist yet.

const WHAT_IT_ISNT = [
  "It is not an emergency service. If you need help right now, tap “Get help now”.",
  "It is not a test, and it does not affect your marks.",
  "It does not diagnose you or put a label on you.",
];

export default function AboutPage() {
  const whoSees = [
    { what: "Your survey answers", who: "Only your school counsellor", show: true },
    { what: "Your messages", who: "Only your counsellor", show: isEnabled("messaging") },
    { what: "Your journal", who: "Only you, unless you choose to share an entry", show: isEnabled("journal") },
    { what: "Board posts", who: "A counsellor reads them first. Shown without your name", show: isEnabled("peerBoard") },
  ].filter((row) => row.show);

  return (
    <article className="space-y-8">
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">About this space</h1>

      <section className="space-y-3">
        <h2 className="text-[22px] font-semibold">What this is</h2>
        <p className="max-w-prose">
          A private place where you can check in and talk to your school counsellor. It is one part of the help around
          you, together with your teachers, your family and your counsellor.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-[22px] font-semibold">What it isn&apos;t</h2>
        <ul className="space-y-2">
          {WHAT_IT_ISNT.map((line) => (
            <li key={line} className="flex gap-3">
              <X aria-hidden size={20} className="mt-1 shrink-0 text-text-muted" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[22px] font-semibold">
          <Eye aria-hidden size={22} className="text-student-accent" />
          Who can see what
        </h2>
        <dl className="divide-y divide-separator overflow-hidden rounded-[18px] border border-separator bg-surface">
          {whoSees.map((row) => (
            <div key={row.what} className="flex flex-col gap-1 p-5 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="font-semibold">{row.what}</dt>
              <dd className="flex items-start gap-2 text-text-muted sm:text-right">
                <Check aria-hidden size={20} className="mt-1 shrink-0 text-student-accent sm:hidden" />
                {row.who}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-[16px] text-text-muted">Your teachers, parents and classmates cannot see any of this.</p>
      </section>

      <section className="space-y-3 rounded-[18px] border border-separator bg-surface p-5">
        <h2 className="flex items-center gap-2 text-[22px] font-semibold">
          <ShieldCheck aria-hidden size={22} className="text-student-accent" />
          One thing we must tell you
        </h2>
        {/* Honest limit of confidentiality: ethically required, and it builds more trust than a false promise. */}
        <p className="max-w-prose">
          If you tell us you might be in danger, your counsellor will talk with you to help keep you safe. They will not
          share more than they need to.
        </p>
      </section>
    </article>
  );
}
