"use client";

import { KeyRound, Lock, Sparkles } from "lucide-react";
import { useActionState, useState, useSyncExternalStore } from "react";
import { redeemCode, type RedeemState } from "@/app/actions/student";
import { OWN_DEVICE_DAYS, STUDENT_IDLE_MINUTES } from "@/lib/accessCodes";
import { createDemoCodeFor, signInDemo } from "@/lib/accessCodeStore";
import { setOwnDevice } from "@/lib/ownDevice";
import { signInDemoStudent } from "@/lib/studentSession";
import { WELCOME_FLAG } from "./NewKeyNote";
import { IDLE_FLAG, markActive } from "./StudentSessionControls";

/** The student who appears when a reviewer taps "Try as a demo student" (School A, Class VI). */
export const DEMO_STUDENT_ID = "S-012";
/** The PIN "Try as a demo student" uses. */
const DEMO_PIN = "2580";

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

// The student types the code from their slip and their own 4-number PIN. No name, ever.
// First time: the PIN they type becomes theirs. After that: the same code and PIN, any time.
export function CodeForm({ mode }: { mode: "demo" | "live" }) {
  const [liveState, liveAction, pending] = useActionState<RedeemState, FormData>(redeemCode, { error: null });
  const [demoError, setDemoError] = useState<string | null>(null);
  // Kept in state so a wrong try doesn't wipe them (a form action resets plain fields). The PIN does clear.
  const [codeText, setCodeText] = useState("");
  const [ownDevice, setOwnDeviceChoice] = useState(false);
  const idle = useSyncExternalStore(noSubscribe, wasIdle, () => false);
  const error = mode === "live" ? liveState.error : demoError;

  function finishDemoSignIn(studentId: string, isNew: boolean, ownDevice: boolean) {
    clearIdleFlag();
    markActive();
    setOwnDevice(ownDevice);
    try {
      // The "you're set up" note: only right after choosing a PIN, never on later sign-ins.
      if (isNew) window.sessionStorage.setItem(WELCOME_FLAG, "1");
      else window.sessionStorage.removeItem(WELCOME_FLAG);
    } catch {
      // storage blocked: the student just won't see the welcome note
    }
    signInDemoStudent(studentId);
  }

  function demoSubmit(formData: FormData) {
    const result = signInDemo(String(formData.get("code") ?? ""), String(formData.get("pin") ?? "").trim());
    if (result.ok) finishDemoSignIn(result.studentId, result.isNew, formData.get("ownDevice") === "on");
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

      <form
        action={mode === "live" ? liveAction : demoSubmit}
        onSubmit={() => {
          clearIdleFlag();
          markActive();
        }}
        className="space-y-5 rounded-[18px] border border-separator bg-surface p-5"
      >
        <div className="space-y-2">
        <label htmlFor="code" className="flex items-center gap-2 font-semibold">
          <KeyRound aria-hidden size={20} className="text-student-accent" />
          Type the code from your slip
        </label>
        <input
          id="code"
          name="code"
          required
          value={codeText}
          onChange={(e) => setCodeText(e.target.value)}
          placeholder="GK-7Q4M"
          // No browser-saved codes (shared computers), no autocorrect.
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
          6 letters and numbers, from the slip your counsellor gave you.
        </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="pin" className="flex items-center gap-2 font-semibold">
            <Lock aria-hidden size={20} className="text-student-accent" />
            Your PIN
          </label>
          <input
            id="pin"
            name="pin"
            required
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            placeholder="••••"
            aria-describedby="pin-help"
            className="min-h-14 w-full rounded-[12px] border border-border bg-surface px-4 text-center font-mono text-[24px] tracking-[0.5em] placeholder:text-text-muted/60"
          />
          <p id="pin-help" className="text-[16px] text-text-muted">
            <strong className="font-semibold text-text">First time?</strong> Choose any 4 numbers and remember them. Next time,
            type your code and the same PIN.
          </p>
        </div>

        <label className="flex min-h-12 items-start gap-3">
          <input type="checkbox" name="ownDevice" checked={ownDevice} onChange={(e) => setOwnDeviceChoice(e.target.checked)} className="mt-1 size-5 shrink-0 accent-student-accent" />
          <span>
            <span className="font-medium">This is my own phone</span>
            <span className="block text-[16px] text-text-muted">
              Keeps you signed in for {OWN_DEVICE_DAYS} days. Leave it unticked on a school or shared computer.
            </span>
          </span>
        </label>

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
        <h2 className="font-semibold">No code, lost it, or forgot your PIN?</h2>
        <p className="text-text-muted">
          Ask your school counsellor or any teacher, and they&apos;ll give you a new code. You
          don&apos;t need a code to get help: tap &ldquo;Get help now&rdquo; at the top, any time.
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
              const result = signInDemo(code.code, DEMO_PIN);
              if (result.ok) finishDemoSignIn(result.studentId, result.isNew, false);
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
