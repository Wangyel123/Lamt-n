"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BoardRow } from "@/lib/board";
import { formatTime } from "@/lib/format";
import { STATUS_LABELS, type FollowUpStatus } from "@/lib/followUps";
import type { Student } from "@/lib/parseCsv";
import { FlagBadge } from "./FlagBadge";
import { Reasons } from "./Reasons";
import { StatusControl } from "./StatusControl";

interface Props {
  row: BoardRow | null;
  ready: boolean;
  onClose: () => void;
  onStatusChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>;
  onNoteSave: (note: string) => Promise<boolean>;
}

// Every answer in plain words. Scale labels use only the endpoints the brief gives
// (we don't invent wording for 2 and 3).
const ANSWERS: { label: string; value: (s: Student) => string | null }[] = [
  { label: "Sleeps well", value: (s) => scale(s.q1SleepWell, "rarely", "always") },
  { label: "Feels safe at home", value: (s) => scale(s.q2SafeAtHome, "never", "always") },
  { label: "Bullied", value: (s) => s.q3Bullied },
  { label: "Has an adult to talk to", value: (s) => s.q4TrustedAdult },
  { label: "Sad most days", value: (s) => s.q5SadMostDays },
  { label: "Thoughts of self-harm", value: (s) => s.q6SelfHarm },
  { label: "Wants to see the counsellor", value: (s) => s.q7WantsCounsellor },
];

function scale(value: number | null, low: string, high: string): string | null {
  return value === null ? null : `${value} of 4 (1 = ${low}, 4 = ${high})`;
}

// Progressive disclosure: the list shows only what's needed to decide who to see first;
// everything else lives here. Uses the native <dialog>, which gives us focus trapping,
// Escape-to-close and a backdrop for free.
export function StudentDrawer({ row, ready, onClose, onStatusChange, onNoteSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (row && !dialog.open) dialog.showModal();
    if (!row && dialog.open) dialog.close();
  }, [row]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="drawer-title"
      className="m-0 ml-auto h-full max-h-none w-full max-w-lg bg-surface p-0 text-text backdrop:bg-text/40"
    >
      {row && (
        <DrawerContent
          key={row.student.studentId} // reset the note box when switching students
          row={row}
          ready={ready}
          onClose={onClose}
          onStatusChange={onStatusChange}
          onNoteSave={onNoteSave}
        />
      )}
    </dialog>
  );
}

function DrawerContent({ row, ready, onClose, onStatusChange, onNoteSave }: Props & { row: BoardRow }) {
  const { student, flag, followUp, status } = row;
  const [note, setNote] = useState(followUp?.note ?? "");
  const [noteState, setNoteState] = useState<"idle" | "saved" | "error">("idle");

  async function saveNote() {
    setNoteState((await onNoteSave(note)) ? "saved" : "error");
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="drawer-title" className="tabular text-2xl font-bold">
            {student.studentId}
          </h2>
          <p className="text-text-muted">
            {student.school} · Class {student.className}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex size-11 items-center justify-center rounded-lg border border-border hover:bg-bg"
        >
          <X aria-hidden size={20} />
        </button>
      </header>

      <section>
        <FlagBadge level={flag.level} />
        {flag.level !== flag.baselineLevel && (
          <p className="mt-1 text-sm text-text-muted">Baseline rules alone would give: {flag.baselineLevel}</p>
        )}
        <div className="mt-2">
          <Reasons reasons={flag.reasons} />
        </div>
      </section>

      <section>
        <h3 className="font-bold">Answers</h3>
        <dl className="mt-1 divide-y divide-border text-sm">
          {ANSWERS.map(({ label, value }) => {
            const v = value(student);
            return (
              <div key={label} className="flex justify-between gap-4 py-1.5">
                <dt className="text-text-muted">{label}</dt>
                <dd className={v === null ? "italic text-text-muted" : "text-right font-bold"}>
                  {v ?? "Missing (not answered or unreadable)"}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* Free-text comments are only ever shown to counsellors, never on the supervisor view. */}
      <section>
        <h3 className="font-bold">Student&apos;s comment</h3>
        {student.comment ? (
          <blockquote className="mt-1 border-l-4 border-border pl-3">&ldquo;{student.comment}&rdquo;</blockquote>
        ) : (
          <p className="text-sm text-text-muted">No comment.</p>
        )}
        {flag.commentKeywords.length > 0 && (
          <p className="mt-1 text-sm text-text-muted">
            Words that triggered the comment check: {flag.commentKeywords.join(", ")}. This is a simple word match,
            not understanding. Please read the comment yourself.
          </p>
        )}
      </section>

      {(student.dataIssues.length > 0 || student.fixes.length > 0) && (
        <section>
          <h3 className="font-bold">Data check</h3>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {student.dataIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
            {student.fixes.map((fix) => (
              <li key={fix} className="text-text-muted">
                {fix}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-bold">Follow-up</h3>
        <StatusControl
          studentId={`${student.studentId}-drawer`}
          level={flag.level}
          status={status}
          disabled={!ready}
          onChange={onStatusChange}
        />

        <div>
          <label htmlFor="private-note" className="block text-sm font-bold">
            Private note <span className="font-normal text-text-muted">(only you can see this)</span>
          </label>
          <textarea
            id="private-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteState("idle");
            }}
            rows={3}
            disabled={!ready}
            className="mt-1 w-full rounded-md border border-border p-2"
          />
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void saveNote()}
              disabled={!ready}
              className="min-h-11 rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-50"
            >
              Save note
            </button>
            <span role="status" aria-live="polite" className="text-sm">
              {noteState === "saved" && <span className="text-primary">Saved ✓</span>}
              {noteState === "error" && <span className="font-bold text-urgent-ink">Couldn&apos;t save, try again</span>}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold">History</h4>
          {followUp && followUp.history.length > 0 ? (
            <ol className="mt-1 space-y-1 text-sm">
              {[...followUp.history].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`}>
                  <span className="text-text-muted">{formatTime(e.at)}:</span>{" "}
                  {e.from ? `${STATUS_LABELS[e.from]} → ` : "Follow-up started: "}
                  {STATUS_LABELS[e.to]}
                  {e.note && <span className="text-text-muted"> · &ldquo;{e.note}&rdquo;</span>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-text-muted">No changes yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
