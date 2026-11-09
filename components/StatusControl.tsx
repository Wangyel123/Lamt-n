"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { FlagLevel } from "@/lib/flags";
import {
  closingNeedsNote,
  FOLLOW_UP_STATUSES,
  isValidClosingNote,
  MIN_CLOSING_NOTE_LENGTH,
  STATUS_LABELS,
  type FollowUpStatus,
} from "@/lib/followUps";

type SaveState = "idle" | "saved" | "error";

interface Props {
  studentId: string;
  level: FlagLevel;
  status: FollowUpStatus | null; // null = student with no concerns and no follow-up yet
  disabled?: boolean; // true until saved statuses have loaded
  onChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>; // false = saving failed
  // "compact": one native dropdown, for list rows (calm, familiar, works on every device).
  // "full": a segmented control, for the detail sheet where there is room.
  variant?: "compact" | "full";
}

// AC-04: set a follow-up to Not started / In progress / Closed. Only three choices (Hick's Law).
export function StatusControl({ studentId, level, status, disabled, onChange, variant = "compact" }: Props) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [closingNote, setClosingNote] = useState("");
  const noteId = useId();
  const controlRef = useRef<HTMLDivElement>(null);
  // Keyboard users land back on the status control after the confirm box closes.
  const refocusStatus = () =>
    setTimeout(() => controlRef.current?.querySelector<HTMLElement>("select, input:checked")?.focus(), 0);

  async function save(to: FollowUpStatus, eventNote = "") {
    const ok = await onChange(to, eventNote);
    setSaveState(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2000);
    return ok;
  }

  function choose(to: FollowUpStatus) {
    if (to === status) return;
    // Closing an Urgent case needs a note: one confirm step, never a single accidental click.
    if (closingNeedsNote(level, to)) {
      setConfirmingClose(true);
      return;
    }
    setConfirmingClose(false);
    void save(to);
  }

  async function confirmClose() {
    if (!isValidClosingNote(closingNote)) return;
    if (await save("closed", closingNote)) {
      setConfirmingClose(false);
      setClosingNote("");
      refocusStatus();
    }
  }

  function cancelClose() {
    setConfirmingClose(false);
    setClosingNote("");
    refocusStatus();
  }

  const feedback = (
    <span role="status" aria-live="polite" className="text-[13px]">
      {saveState === "saved" && (
        <span className="inline-flex items-center gap-1 text-primary">
          <Check aria-hidden size={14} /> Saved
        </span>
      )}
      {saveState === "error" && <span className="font-semibold text-urgent-ink">Couldn&apos;t save. Try again.</span>}
    </span>
  );

  // Students with no concerns: counsellors may know things the survey doesn't.
  if (status === null) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void save("not_started")}
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[15px] font-medium text-primary hover:bg-fill disabled:opacity-50"
        >
          <Plus aria-hidden size={16} /> Add follow-up
        </button>
        {feedback}
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={controlRef}>
      <div className="flex flex-wrap items-center gap-2">
        {variant === "compact" ? (
          <span className="relative inline-flex">
            <select
              aria-label={`Follow-up for ${studentId}`}
              value={status}
              disabled={disabled}
              onChange={(e) => choose(e.target.value as FollowUpStatus)}
              className="min-h-11 appearance-none rounded-full bg-fill py-2 pr-9 pl-4 text-[15px] font-medium disabled:opacity-50"
            >
              {FOLLOW_UP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted" />
          </span>
        ) : (
          <fieldset disabled={disabled} className="disabled:opacity-50">
            <legend className="sr-only">Follow-up for {studentId}</legend>
            {/* Apple-style segmented control built from real radio buttons (keyboard + screen readers) */}
            <div className="inline-flex rounded-[10px] bg-fill p-0.5">
              {FOLLOW_UP_STATUSES.map((option) => {
                const checked = option === status;
                return (
                  <label
                    key={option}
                    className={`flex min-h-11 cursor-pointer items-center rounded-lg px-4 text-[15px] transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary ${
                      checked ? "bg-surface font-semibold shadow-[0_1px_3px_hsla(0,0%,0%,.15)]" : "text-text"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={`status-${studentId}`}
                      value={option}
                      checked={checked}
                      onChange={() => choose(option)}
                    />
                    {STATUS_LABELS[option]}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
        {feedback}
      </div>

      {confirmingClose && (
        <div className="max-w-md rounded-2xl bg-urgent-tint p-4">
          <label htmlFor={noteId} className="block text-[15px] font-semibold">
            Closing an urgent case needs a short note
          </label>
          <p className="text-[13px] text-text-muted">What was done, and who else was involved.</p>
          <textarea
            id={noteId}
            autoFocus // the confirm box just opened: put the cursor where the user must type
            value={closingNote}
            onChange={(e) => setClosingNote(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-[15px]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void confirmClose()}
              disabled={!isValidClosingNote(closingNote)}
              className="min-h-11 rounded-full bg-primary px-5 font-semibold text-white disabled:opacity-50"
            >
              Close case
            </button>
            <button type="button" onClick={cancelClose} className="min-h-11 rounded-full px-5 font-semibold text-primary hover:bg-surface">
              Cancel
            </button>
          </div>
          {!isValidClosingNote(closingNote) && closingNote.length > 0 && (
            <p className="mt-1 text-[13px] text-text-muted">Please write at least {MIN_CLOSING_NOTE_LENGTH} characters.</p>
          )}
        </div>
      )}
    </div>
  );
}
