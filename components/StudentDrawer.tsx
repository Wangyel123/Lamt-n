"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BoardRow } from "@/lib/board";
import { levelMeaning, LEVEL_NAME } from "@/lib/flags";
import { formatTime } from "@/lib/format";
import { STATUS_LABELS, type FollowUpStatus } from "@/lib/followUps";
import type { Student } from "@/lib/parseCsv";
import { FlagBadge } from "./FlagBadge";
import { StatusControl } from "./StatusControl";

interface Props {
  row: BoardRow | null;
  ready: boolean;
  useExtraRules: boolean;
  onClose: () => void;
  onStatusChange: (to: FollowUpStatus, eventNote: string) => Promise<boolean>;
  onNoteSave: (note: string) => Promise<boolean>;
}

// Each answer as the question a counsellor would ask. Scale answers use only the end labels
// the survey gives (1 = rarely, 4 = always); we don't invent words for 2 and 3.
const ANSWERS: { label: string; value: (s: Student) => string | null }[] = [
  { label: "Sleeps well", value: (s) => scale(s.q1SleepWell, "rarely", "always") },
  { label: "Feels safe at home", value: (s) => scale(s.q2SafeAtHome, "never", "always") },
  { label: "Bullied", value: (s) => s.q3Bullied },
  { label: "Has an adult to talk to", value: (s) => s.q4TrustedAdult },
  { label: "Sad most days", value: (s) => s.q5SadMostDays },
  { label: "Thoughts of self-harm", value: (s) => s.q6SelfHarm },
  { label: "Wants to see you", value: (s) => s.q7WantsCounsellor },
];

function scale(value: number | null, low: string, high: string): string | null {
  return value === null ? null : `${value} out of 4 (1 = ${low}, 4 = ${high})`;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="px-4 text-[13px] font-medium tracking-wide text-text-muted uppercase">{title}</h3>
      <div className="rounded-2xl bg-surface">{children}</div>
    </section>
  );
}

// Everything about one student, in a sheet that slides over the list (progressive disclosure:
// the list shows only what's needed to decide who to see first). Native <dialog> gives focus
// trapping, Escape-to-close and a backdrop for free.
export function StudentDrawer({ row, onClose, ...rest }: Props) {
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
      className="m-0 ml-auto h-full max-h-none w-full max-w-lg bg-bg p-0 text-text backdrop:bg-black/30"
    >
      {row && <DrawerContent key={row.student.studentId} row={row} onClose={onClose} {...rest} />}
    </dialog>
  );
}

function DrawerContent({ row, ready, useExtraRules, onClose, onStatusChange, onNoteSave }: Props & { row: BoardRow }) {
  const { student, flag, followUp, status } = row;
  const [note, setNote] = useState(followUp?.note ?? "");
  const [noteState, setNoteState] = useState<"idle" | "saved" | "error">("idle");

  return (
    <div className="flex flex-col gap-6 p-4 pb-10 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="drawer-title" className="tabular text-[28px] leading-tight font-bold">
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
          className="flex size-11 items-center justify-center rounded-full bg-fill"
        >
          <X aria-hidden size={18} />
        </button>
      </header>

      <div className="space-y-2 px-1">
        <FlagBadge level={flag.level} />
        <p className="text-[15px] text-text-muted">{levelMeaning(flag.level, useExtraRules)}</p>
        {flag.level !== flag.baselineLevel && (
          <p className="text-[13px] text-text-muted">The basic rules alone would say: {LEVEL_NAME[flag.baselineLevel]}.</p>
        )}
      </div>

      {flag.reasons.length > 0 && (
        <Group title={flag.level === "None" ? "Also noted" : "Why this student is on the list"}>
          <ul className="divide-y divide-separator">
            {flag.reasons.map((r) => (
              <li key={r.id} className={`px-4 py-3 ${r.primary ? "font-medium" : "text-text-muted"}`}>
                {r.text}
                {r.extra && <span className="text-text-muted"> (extra check)</span>}
              </li>
            ))}
          </ul>
        </Group>
      )}

      <Group title="Their answers">
        <dl className="divide-y divide-separator">
          {ANSWERS.map(({ label, value }) => {
            const v = value(student);
            return (
              <div key={label} className="flex justify-between gap-4 px-4 py-3">
                <dt>{label}</dt>
                <dd className={v === null ? "text-text-muted italic" : "text-right text-text-muted"}>{v ?? "Not answered"}</dd>
              </div>
            );
          })}
        </dl>
      </Group>

      {/* Free-text comments are only ever shown to counsellors, never on the supervisor view. */}
      <Group title="Their comment">
        <div className="px-4 py-3">
          {student.comment ? <p>&ldquo;{student.comment}&rdquo;</p> : <p className="text-text-muted">No comment.</p>}
          {flag.commentKeywords.length > 0 && (
            <p className="mt-2 text-[13px] text-text-muted">
              Flagged because it contains: {flag.commentKeywords.join(", ")}. This is a simple word check, so please read
              the comment yourself.
            </p>
          )}
        </div>
      </Group>

      {(student.dataIssues.length > 0 || student.fixes.length > 0) && (
        <Group title="Please check">
          <ul className="divide-y divide-separator text-[15px]">
            {student.dataIssues.map((issue) => (
              <li key={issue} className="px-4 py-3">
                {issue.replace("Missing answer:", "Left blank:")}. We don&apos;t guess, so this question counts as unknown.
              </li>
            ))}
            {student.fixes.map((fix) => (
              <li key={fix} className="px-4 py-3 text-text-muted">
                {fix}
              </li>
            ))}
          </ul>
        </Group>
      )}

      <Group title="Your follow-up">
        <div className="space-y-4 p-4">
          <StatusControl
            studentId={`${student.studentId}-sheet`}
            level={flag.level}
            status={status}
            disabled={!ready}
            onChange={onStatusChange}
            variant="full"
          />
          <div>
            <label htmlFor="private-note" className="block text-[15px] font-medium">
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
              className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-[15px]"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={async () => setNoteState((await onNoteSave(note)) ? "saved" : "error")}
                disabled={!ready}
                className="min-h-11 rounded-full bg-primary px-5 font-semibold text-white disabled:opacity-50"
              >
                Save note
              </button>
              <span role="status" aria-live="polite" className="text-[13px]">
                {noteState === "saved" && <span className="text-primary">Saved</span>}
                {noteState === "error" && <span className="font-semibold text-urgent-ink">Couldn&apos;t save. Try again.</span>}
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-[15px] font-medium">History</h4>
            {followUp && followUp.history.length > 0 ? (
              <ol className="mt-1 space-y-1 text-[15px] text-text-muted">
                {[...followUp.history].reverse().map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    {formatTime(e.at)}: {e.from ? `${STATUS_LABELS[e.from]} → ` : "Started: "}
                    {STATUS_LABELS[e.to]}
                    {e.note && <> · &ldquo;{e.note}&rdquo;</>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-[15px] text-text-muted">No changes yet.</p>
            )}
          </div>
        </div>
      </Group>
    </div>
  );
}
