import { ChevronRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTIVITIES } from "@/lib/activities";
import { isEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Self-care activities · My Wellbeing Space" };

// K-03: short, pre-written activities. No sign-in needed: nothing personal is saved here.
export default function ActivitiesPage() {
  if (!isEnabled("activities")) notFound();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">Self-care activities</h1>
        <p className="text-text-muted">Short things you can try when you feel worried, sad or stressed. Each one takes 1 to 3 minutes.</p>
      </header>
      <ul className="space-y-3">
        {ACTIVITIES.map((a) => (
          <li key={a.slug}>
            <Link href={`/student/activities/${a.slug}`} className="flex min-h-12 items-center gap-4 rounded-3xl bg-surface p-5">
              <span className="flex-1">
                <span className="block font-semibold">{a.title}</span>
                <span className="text-[16px] text-text-muted">{a.summary}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[14px] text-text-muted">
                <Clock aria-hidden size={14} /> {a.minutes} min
              </span>
              <ChevronRight aria-hidden className="shrink-0 text-border" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
