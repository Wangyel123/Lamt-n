"use client";

import { useState, useSyncExternalStore } from "react";

export const WELCOME_FLAG = "sa-welcome-new"; // demo mode; live mode uses ?welcome=new

const noSubscribe = () => () => {};
const isNew = () => {
  if (new URLSearchParams(window.location.search).get("welcome") === "new") return true;
  try {
    return window.sessionStorage.getItem(WELCOME_FLAG) === "1";
  } catch {
    return false;
  }
};

// Shown once, right after a student chooses their PIN: the one thing they must remember.
export function NewKeyNote() {
  const shown = useSyncExternalStore(noSubscribe, isNew, () => false);
  const [closed, setClosed] = useState(false);
  if (!shown || closed) return null;
  return (
    <div role="status" className="space-y-3 rounded-[18px] border border-separator bg-surface p-5">
      <p className="font-semibold">You&apos;re all set up.</p>
      <p>
        Next time, type the code from your slip and the <strong className="font-semibold">same 4 numbers</strong> you just chose as
        your PIN. Keep your slip somewhere private.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            window.sessionStorage.removeItem(WELCOME_FLAG);
          } catch {
            // ignore
          }
          window.history.replaceState(null, "", window.location.pathname);
          setClosed(true);
        }}
        className="min-h-12 rounded-[12px] border border-separator bg-surface px-5 font-semibold text-student-accent"
      >
        Got it
      </button>
    </div>
  );
}
