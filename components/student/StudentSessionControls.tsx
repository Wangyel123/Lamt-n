"use client";

import { DoorOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOutStudent } from "@/app/actions/student";
import { STUDENT_IDLE_MINUTES } from "@/lib/accessCodes";
import { signOutDemoStudent } from "@/lib/studentSession";

type Mode = "demo" | "live";

/** "Leave": signs the student out and goes back to the start page. On every student screen. */
export function LeaveButton({ mode }: { mode: Mode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (mode === "demo") {
          signOutDemoStudent();
          router.push("/");
        } else {
          void signOutStudent();
        }
      }}
      className="inline-flex min-h-12 items-center gap-1.5 rounded-[12px] px-3 font-medium text-student-accent hover:bg-surface"
    >
      <DoorOpen aria-hidden size={18} />
      Leave
    </button>
  );
}

export const IDLE_FLAG = "sa-signed-out-idle"; // tells the code form to explain why the student was signed out

/**
 * Shared-device safety: if nobody touches the page for STUDENT_IDLE_MINUTES, sign out, so the
 * next person at a school computer can't see this student's space. Rendered only while signed in.
 */
export function IdleSignOut({ mode }: { mode: Mode }) {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const signOut = () => {
      if (mode === "demo") {
        try {
          window.sessionStorage.setItem(IDLE_FLAG, "1");
        } catch {
          // storage blocked: the student just won't see the explanation
        }
        signOutDemoStudent();
        router.push("/student");
      } else {
        void signOutStudent("idle");
      }
    };
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(signOut, STUDENT_IDLE_MINUTES * 60 * 1000);
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, restart, { passive: true }));
    restart();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, restart));
    };
  }, [mode, router]);
  return null;
}
