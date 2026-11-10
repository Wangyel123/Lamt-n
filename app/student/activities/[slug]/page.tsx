import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTIVITIES, findActivity } from "@/lib/activities";
import { isEnabled } from "@/lib/features";

export const generateStaticParams = () => ACTIVITIES.map((a) => ({ slug: a.slug }));
export const metadata: Metadata = { title: "Activity · My Wellbeing Space" };

// K-03: one activity: numbered steps, an optional calm breathing circle, and a gentle way to talk.
export default async function ActivityPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isEnabled("activities")) notFound();
  const activity = findActivity((await params).slug);
  if (!activity) notFound();

  return (
    <article className="space-y-6">
      <Link href="/student/activities" className="inline-flex min-h-12 items-center gap-1 font-medium text-student-accent">
        <ArrowLeft aria-hidden size={18} /> All activities
      </Link>
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{activity.title}</h1>
        <p className="text-text-muted">
          {activity.summary} About {activity.minutes} {activity.minutes === 1 ? "minute" : "minutes"}.
        </p>
      </header>

      {activity.breathing && (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-separator bg-surface p-6">
          <div aria-hidden className="breathe size-40 rounded-full bg-student-accent/25 ring-8 ring-student-accent/15" />
          <p className="text-[16px] text-text-muted">Breathe in as the circle grows, hold, then breathe out as it shrinks.</p>
        </div>
      )}

      <ol className="space-y-3">
        {activity.steps.map((step, i) => (
          <li key={step} className="flex gap-4 rounded-[18px] border border-separator bg-surface p-5">
            <span aria-hidden className="tabular flex size-9 shrink-0 items-center justify-center rounded-full bg-student-bg font-semibold text-student-accent">
              {i + 1}
            </span>
            <span>
              <span className="sr-only">Step {i + 1}: </span>
              {step}
            </span>
          </li>
        ))}
      </ol>

      {isEnabled("messaging") && (
        <Link href="/student/messages" className="flex min-h-12 items-center gap-3 rounded-[18px] border border-border p-5 font-semibold text-student-accent">
          <MessageCircle aria-hidden size={20} /> Want to talk about it? Message your counsellor
        </Link>
      )}
    </article>
  );
}
