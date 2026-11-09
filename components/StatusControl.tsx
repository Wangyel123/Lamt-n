"use client";

import { Check, Plus } from "lucide-react";
import { useId, useState } from "react";
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
  status: FollowUpStatus | null; // null = None student, no follow-up yet
  disabled?: boolean; // true until saved statuses have loaded
  onChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>; // resolves false if saving failed
}

// AC-04: a 3-option segmented control. Only 3 choices keeps decisions quick (Hick's Law).
// Built from real radio buttons, so keyboard and screen readers work out of the box.
export function StatusControl({ studentId, level, status, disabled, onChange }: Props) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [closingNote, setClosingNote] = useState("");
  const noteId = useId();

  async function save(to: FollowUpStatus, eventNote = "") {
    const ok = await onChange(to, eventNote);
    setSaveState(ok ? "saved" : "error");
    // The "Saved ✓" tick fades after a moment; an error stays until the next try.
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
    }
  }

  const feedback = (
    <span role="status" aria-live="polite" className="text-sm">
      {saveState === "saved" && (
        <span className="inline-flex items-center gap-1 text-primary">
          <Check aria-hidden size={16} /> Saved
        </span>
      )}
      {saveState === "error" && <span className="font-bold text-urgent-ink">Couldn&apos;t save, try again</span>}
    </span>
  );

  // None students: counsellors may know things the survey doesn't, so allow adding a follow-up.
  if (status === null) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-muted">No follow-up needed</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void save("not_started")}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-bold text-primary hover:bg-bg disabled:opacity-50"
        >
          <Plus aria-hidden size={16} /> Add follow-up anyway
        </button>
        {feedback}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <fieldset disabled={disabled} className="disabled:opacity-50">
          <legend className="sr-only">Follow-up status for {studentId}</legend>
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {FOLLOW_UP_STATUSES.map((option) => {
              const checked = option === status;
              return (
                <label
                  key={option}
                  className={`flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary ${
                    checked ? "bg-primary font-bold text-white" : "text-text hover:bg-bg"
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
        {feedback}
      </div>

      {confirmingClose && (
        <div className="max-w-prose rounded-lg border-2 border-urgent bg-surface p-3">
          <label htmlFor={noteId} className="block text-sm font-bold">
            Closing an urgent case needs a short note
          </label>
          <p className="text-sm text-text-muted">For example: what was done, who else was involved.</p>
          <textarea
            id={noteId}
            value={closingNote}
            onChange={(e) => setClosingNote(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-md border border-border p-2"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void confirmClose()}
              disabled={!isValidClosingNote(closingNote)}
              className="min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50"
            >
              Close case
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingClose(false);
                setClosingNote("");
              }}
              className="min-h-11 rounded-lg border border-border px-4 font-bold"
            >
              Cancel
            </button>
          </div>
          {!isValidClosingNote(closingNote) && closingNote.length > 0 && (
            <p className="mt-1 text-sm text-text-muted">Please write at least {MIN_CLOSING_NOTE_LENGTH} characters.</p>
          )}
        </div>
      )}
    </div>
  );
}
