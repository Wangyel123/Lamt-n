"use client";

import { DoorOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOutStudent } from "@/app/actions/student";
import { STUDENT_IDLE_MINUTES } from "@/lib/accessCodes";
import { isOwnDevice, setOwnDevice } from "@/lib/ownDevice";
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
          setOwnDevice(false);
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
const LAST_ACTIVE_KEY = "sa-student-last-active"; // so a CLOSED tab can't leave a student signed in either

const readLastActive = () => {
  try {
    return Number(window.localStorage.getItem(LAST_ACTIVE_KEY)) || 0;
  } catch {
    return 0;
  }
};
/** Also called by the code form on sign-in, so an old timestamp never signs a new session out. */
export const markActive = () => {
  try {
    window.localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // storage blocked: the in-page timer still works
  }
};

/**
 * Shared-device safety: if nobody touches the page for STUDENT_IDLE_MINUTES, sign out, so the
 * next person at a school computer can't see this student's space. Also on opening the page: if the
 * last activity was longer ago than that (the tab was closed and reopened later), sign out at once.
 * Skipped on a device the student marked "This is my own phone". Rendered only while signed in.
 */
export function IdleSignOut({ mode }: { mode: Mode }) {
  const router = useRouter();
  useEffect(() => {
    if (isOwnDevice()) return; // the student's own phone: stay signed in
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
    const limit = STUDENT_IDLE_MINUTES * 60 * 1000;
    const last = readLastActive();
    if (last && Date.now() - last > limit) {
      signOut();
      return;
    }
    const restart = () => {
      markActive();
      clearTimeout(timer);
      timer = setTimeout(signOut, limit);
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
