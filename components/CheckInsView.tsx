"use client";

import { ChevronDown, Send } from "lucide-react";
import { useState } from "react";
import { QUESTION_BANK, type CheckIn, type CheckInResponse, type QuestionId } from "@/lib/checkins";
import { classOptions } from "@/lib/filters";
import type { BoardRow } from "@/lib/board";
import { newId } from "@/lib/collectionStore";
import { formatTime } from "@/lib/format";
import { checkIns as checkInStore } from "@/lib/stores";

const select = "min-h-11 w-full appearance-none rounded-xl border border-border bg-surface py-2 pr-9 pl-3 text-[15px]";

// P-04, counsellor side: send a short check-in to a school or class, and see how many answered.
export function CheckInsView({ rows, sent, responses }: { rows: BoardRow[]; sent: CheckIn[]; responses: CheckInResponse[] }) {
  const schools = [...new Set(rows.map((r) => r.student.school))].sort();
  const [school, setSchool] = useState(schools[0] ?? "");
  const [className, setClassName] = useState("");
  const [questions, setQuestions] = useState<QuestionId[]>(["feeling", "worry"]);
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");

  const toggle = (q: QuestionId) => setQuestions((qs) => (qs.includes(q) ? qs.filter((x) => x !== q) : [...qs, q]));
  const ordered = (Object.keys(QUESTION_BANK) as QuestionId[]).filter((q) => questions.includes(q));

  async function send() {
    const ok = await checkInStore.add({
      id: newId(),
      school,
      className: className || null,
      questions: ordered,
      createdAt: new Date().toISOString(),
    });
    setState(ok ? "sent" : "error");
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-surface p-4">
        <h2 className="text-[20px] font-semibold">Send a quick check-in</h2>
        <p className="text-[15px] text-text-muted">
          2–3 short questions between surveys. Students can skip any question. Answers appear on each student&apos;s timeline.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[15px] font-medium">
            School
            <span className="relative mt-1 block">
              <select
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value);
                  setClassName("");
                }}
                className={select}
              >
                {schools.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                size={16}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
              />
            </span>
          </label>
          <label className="block text-[15px] font-medium">
            Class
            <span className="relative mt-1 block">
              <select value={className} onChange={(e) => setClassName(e.target.value)} className={select}>
                <option value="">The whole school</option>
                {classOptions(rows, school).map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                size={16}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
              />
            </span>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-[15px] font-medium">Questions (from the approved list)</legend>
          {(Object.keys(QUESTION_BANK) as QuestionId[]).map((q) => (
            <label key={q} className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={questions.includes(q)}
                onChange={() => toggle(q)}
                className="size-5 accent-primary"
              />
              <span>
                {QUESTION_BANK[q].text}
                {QUESTION_BANK[q].optional ? " (written answer)" : ""}
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={ordered.length === 0 || !school}
            onClick={() => void send()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 font-semibold text-white disabled:opacity-50"
          >
            <Send aria-hidden size={16} /> Send check-in
          </button>
          <span role="status" aria-live="polite" className="text-[13px]">
            {state === "sent" && <span className="text-primary">Sent. Students will see it in their space.</span>}
            {state === "error" && <span className="font-semibold text-urgent-ink">Couldn&apos;t send. Try again.</span>}
          </span>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-4 text-[13px] font-medium tracking-wide text-text-muted uppercase">Sent check-ins</h2>
        {sent.length === 0 ? (
          <p className="rounded-2xl bg-surface p-6 text-center text-text-muted">None sent yet.</p>
        ) : (
          <ul className="divide-y divide-separator rounded-2xl bg-surface">
            {[...sent]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <span>
                    <span className="font-medium">
                      {c.school}
                      {c.className ? ` · Class ${c.className}` : " · whole school"}
                    </span>
                    <span className="block text-[13px] text-text-muted">
                      Sent {formatTime(c.createdAt)} · {c.questions.length} questions
                    </span>
                  </span>
                  <span className="tabular text-[15px] text-text-muted">
                    {responses.filter((r) => r.checkInId === c.id).length} answered
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
