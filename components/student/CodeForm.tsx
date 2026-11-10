"use client";

import { KeyRound, Sparkles } from "lucide-react";
import { useActionState, useState, useSyncExternalStore } from "react";
import { redeemCode, type RedeemState } from "@/app/actions/student";
import { STUDENT_IDLE_MINUTES } from "@/lib/accessCodes";
import { createDemoCodeFor, redeemDemoCode } from "@/lib/accessCodeStore";
import { signInDemoStudent } from "@/lib/studentSession";
import { IDLE_FLAG } from "./StudentSessionControls";

/** The student who appears when a reviewer taps "Try as a demo student" (School A, Class VI). */
export const DEMO_STUDENT_ID = "S-012";

// Was the student just signed out for being idle? Live mode says so in the address bar (server
// redirect); demo mode leaves a flag in sessionStorage. Read-only here, no server needed.
const wasIdle = () => {
  if (new URLSearchParams(window.location.search).get("signedOut") === "idle") return true;
  try {
    return window.sessionStorage.getItem(IDLE_FLAG) === "1";
  } catch {
    return false;
  }
};
const clearIdleFlag = () => {
  try {
    window.sessionStorage.removeItem(IDLE_FLAG);
  } catch {
    // ignore
  }
};
const noSubscribe = () => () => {};

// The student types the code from their slip. No name, no password, nothing saved by the browser.
export function CodeForm({ mode }: { mode: "demo" | "live" }) {
  const [liveState, liveAction, pending] = useActionState<RedeemState, FormData>(redeemCode, { error: null });
  const [demoError, setDemoError] = useState<string | null>(null);
  const idle = useSyncExternalStore(noSubscribe, wasIdle, () => false);
  const error = mode === "live" ? liveState.error : demoError;

  function demoSubmit(formData: FormData) {
    const result = redeemDemoCode(String(formData.get("code") ?? ""));
    if (result.ok) {
      clearIdleFlag();
      signInDemoStudent(result.studentId);
    }
    else setDemoError(result.message);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Welcome to your space</h1>
        <p className="text-text-muted">A private place to check in with your school counsellor. You never need to type your name.</p>
      </header>

      {idle && (
        <p role="status" className="rounded-[18px] border border-separator bg-surface p-5">
          You were signed out because the page was left alone for {STUDENT_IDLE_MINUTES} minutes. This keeps your space private on
          shared computers.
        </p>
      )}

      <form action={mode === "live" ? liveAction : demoSubmit} className="space-y-4 rounded-[18px] border border-separator bg-surface p-5">
        <label htmlFor="code" className="flex items-center gap-2 font-semibold">
          <KeyRound aria-hidden size={20} className="text-student-accent" />
          Type the code from your slip
        </label>
        <input
          id="code"
          name="code"
          required
          placeholder="GK-7Q4M"
          // No browser-saved codes, no autocorrect: this is a one-time key, not a password to remember.
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={9}
          aria-describedby="code-help"
          className="min-h-14 w-full rounded-[12px] border border-border bg-surface px-4 text-center font-mono text-[24px] tracking-[0.2em] uppercase placeholder:tracking-[0.2em] placeholder:text-text-muted/60"
        />
        <p id="code-help" className="text-[16px] text-text-muted">
          6 letters and numbers. Your counsellor gives you a new code if this one doesn&apos;t work.
        </p>
        {error && (
          <p role="alert" className="font-medium">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="min-h-12 w-full rounded-[12px] bg-student-accent font-semibold text-white disabled:opacity-60">
          {pending ? "Checking…" : "Go to my space"}
        </button>
      </form>

      {/* For students with no code: the research says not knowing where to go is a top barrier. */}
      <section className="space-y-1 px-1">
        <h2 className="font-semibold">No code, or lost it?</h2>
        <p className="text-text-muted">
          Ask your school counsellor or any teacher, and they&apos;ll give you a new one. You don&apos;t need a code to get help: tap
          &ldquo;Get help now&rdquo; at the top, any time.
        </p>
      </section>

      {mode === "demo" && (
        <div className="space-y-2 rounded-[18px] border border-dashed border-border p-5">
          <p className="text-[16px] text-text-muted">
            Reviewing the demo? Counsellors make real codes from a student&apos;s details. Or skip that and try it right away:
          </p>
          <button
            type="button"
            onClick={() => {
              const code = createDemoCodeFor(DEMO_STUDENT_ID);
              const result = redeemDemoCode(code.code);
              if (result.ok) {
                clearIdleFlag();
                signInDemoStudent(result.studentId);
              }
            }}
            className="inline-flex min-h-12 items-center gap-2 rounded-[12px] border border-separator bg-surface px-5 font-semibold text-student-accent"
          >
            <Sparkles aria-hidden size={18} />
            Try as a demo student <span className="whitespace-nowrap">({DEMO_STUDENT_ID})</span>
          </button>
        </div>
      )}
    </div>
  );
}
