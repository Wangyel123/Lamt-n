"use client";

import { Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FEELING_LABELS, QUESTION_BANK, WORRY_OPTIONS, type CheckIn, type Feeling, type Worry } from "@/lib/checkins";
import { newId } from "@/lib/collectionStore";
import { CARING_REPLY } from "@/lib/messages";
import { needsAlert, scanText } from "@/lib/sensitiveText";
import { checkInResponses } from "@/lib/stores";
import { useStudentCheckIns } from "@/lib/useStudentCheckIns";
import { SignedInOnly } from "./SignedInOnly";

const FACES: Record<Feeling, LucideIcon> = { 1: Frown, 2: Meh, 3: Smile, 4: Laugh };

// P-04, student side: one question per screen, progress shown, everything skippable.
export function StudentCheckIn({ liveStudentId }: { liveStudentId?: string }) {
  return <SignedInOnly liveStudentId={liveStudentId}>{(studentId) => <Flow studentId={studentId} />}</SignedInOnly>;
}

function Flow({ studentId }: { studentId: string }) {
  const { pending, ready } = useStudentCheckIns(studentId);
  const checkIn = pending[0] ?? null; // newest waiting check-in
  if (!ready) return <p role="status" className="text-text-muted">Loading…</p>;
  if (!checkIn)
    return (
      <div className="space-y-4">
        <h1 className="text-[32px] leading-tight font-bold">Check-in</h1>
        <p className="rounded-3xl bg-surface p-5">There&apos;s no check-in waiting for you right now. Thank you!</p>
        <Link href="/student" className="inline-flex min-h-12 items-center rounded-full bg-student-accent px-5 font-semibold text-white">
          Back to my space
        </Link>
      </div>
    );
  return <Questions key={checkIn.id} checkIn={checkIn} studentId={studentId} />;
}

function Questions({ checkIn, studentId }: { checkIn: CheckIn; studentId: string }) {
  const steps = checkIn.questions;
  const [step, setStep] = useState(0);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [worry, setWorry] = useState<Worry | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<null | { caring: boolean }>(null);
  const [error, setError] = useState(false);
  const question = steps[step];
  const last = step === steps.length - 1;

  async function finish() {
    const ok = await checkInResponses.add({ id: newId(), checkInId: checkIn.id, studentId, feeling, worry, comment: comment.trim(), createdAt: new Date().toISOString() });
    if (!ok) return setError(true);
    setDone({ caring: needsAlert(scanText(comment)) });
  }
  const next = () => (last ? void finish() : setStep(step + 1));

  if (done)
    return (
      <div className="space-y-4">
        <h1 className="text-[32px] leading-tight font-bold">Thank you</h1>
        <p className="rounded-3xl bg-surface p-5">Thanks for checking in. If you want to talk, your counsellor is here for you any time.</p>
        {done.caring && <p className="rounded-3xl border-2 border-student-accent bg-surface p-5">{CARING_REPLY}</p>}
        <Link href="/student" className="inline-flex min-h-12 items-center rounded-full bg-student-accent px-5 font-semibold text-white">
          Back to my space
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold text-text-muted">Check-in from your counsellor</h1>
      <p className="text-[16px] text-text-muted" aria-live="polite">
        Question {step + 1} of {steps.length} · You can skip any question
      </p>
      <div aria-hidden className="h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-student-accent transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-[26px] leading-tight font-bold">{QUESTION_BANK[question].text}</legend>
        {question === "feeling" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([1, 2, 3, 4] as Feeling[]).map((f) => {
              const Face = FACES[f];
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={feeling === f}
                  onClick={() => setFeeling(f)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl bg-surface p-3 font-semibold ${feeling === f ? "ring-3 ring-student-accent" : ""}`}
                >
                  <Face aria-hidden size={36} className="text-student-accent" />
                  {FEELING_LABELS[f]}
                </button>
              );
            })}
          </div>
        )}
        {question === "worry" && (
          <div className="space-y-3">
            {WORRY_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={worry === w}
                onClick={() => setWorry(w)}
                className={`block min-h-14 w-full rounded-3xl bg-surface px-5 text-left font-semibold ${worry === w ? "ring-3 ring-student-accent" : ""}`}
              >
                {w}
              </button>
            ))}
          </div>
        )}
        {question === "comment" && (
          <label className="block">
            <span className="sr-only">Your answer</span>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={500} className="w-full rounded-3xl border border-border bg-surface p-4" />
          </label>
        )}
      </fieldset>

      {error && <p role="alert">That didn&apos;t save. Please try again.</p>}
      <div className="flex flex-wrap gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="min-h-12 rounded-full bg-surface px-5 font-semibold">
            Back
          </button>
        )}
        <button type="button" onClick={next} className="min-h-12 flex-1 rounded-full bg-student-accent px-5 font-semibold text-white">
          {last ? "Send" : "Next"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (question === "feeling") setFeeling(null);
            if (question === "worry") setWorry(null);
            if (question === "comment") setComment("");
            next();
          }}
          className="min-h-12 rounded-full px-5 font-semibold text-student-accent"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
