"use client";

import { LifeBuoy, X } from "lucide-react";
import { HelpContacts } from "@/components/HelpContacts";
import { useRef } from "react";

// K-05: "Get help now", always in the student header. Calm green, never red: we want a student
// to feel safe opening it, not alarmed. It points to REAL people first (a trusted adult, the
// counsellor), because this app is not an emergency service.
//
// Contacts come from lib/helpContacts.ts (official sources only). Also public at /help, no code needed.
export function GetHelpSheet() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-student-accent px-4 font-semibold text-white"
      >
        <LifeBuoy aria-hidden size={18} />
        Get help now
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="get-help-title"
        className="m-0 mt-auto max-h-[90vh] w-full max-w-none rounded-t-3xl bg-student-bg p-0 text-text backdrop:bg-black/30 sm:m-auto sm:max-w-lg sm:rounded-[18px]"
      >
        <div className="space-y-5 p-5 pb-8 text-[18px]">
          <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-separator sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <h2 id="get-help-title" className="text-[24px] leading-tight font-semibold">
              Get help now
            </h2>
            <button type="button" onClick={close} aria-label="Close" className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-separator bg-surface">
              <X aria-hidden size={20} />
            </button>
          </div>

          <p>If you feel unsafe or very upset right now, you don&apos;t have to wait. You can reach someone any time.</p>

          <HelpContacts />

          <p className="text-[16px] text-text-muted">This app is not an emergency service. A real person is always the first place to go.</p>

          <button type="button" onClick={close} className="min-h-12 w-full rounded-[12px] border border-separator bg-surface font-semibold">
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
