"use client";

import { Check, Frown, Laugh, Lock, Meh, Plus, Smile, Trash2, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/collectionStore";
import { formatTime } from "@/lib/format";
import { GOAL_ENCOURAGEMENT, type JournalEntry } from "@/lib/journal";
import { goals as goalStore, journalEntries } from "@/lib/stores";
import { Switch } from "../Switch";
import { SignedInOnly } from "./SignedInOnly";

const MOODS: { value: 1 | 2 | 3 | 4; icon: LucideIcon; label: string }[] = [
  { value: 1, icon: Frown, label: "Not good" },
  { value: 2, icon: Meh, label: "A bit low" },
  { value: 3, icon: Smile, label: "Okay" },
  { value: 4, icon: Laugh, label: "Good" },
];

// K-04: a private journal and simple goals. PRIVATE BY DEFAULT: nothing is shared unless the
// student turns sharing on for a specific entry.
export function StudentJournal({ liveStudentId }: { liveStudentId?: string }) {
  return (
    <SignedInOnly liveStudentId={liveStudentId}>
      {(studentId) => (
        <div className="space-y-10">
          <Journal studentId={studentId} />
          <Goals studentId={studentId} />
        </div>
      )}
    </SignedInOnly>
  );
}

function ShareSwitch({ shared, onChange, id }: { shared: boolean; onChange: (v: boolean) => void; id: string }) {
  return <Switch checked={shared} onChange={onChange} labelledBy={id} tone="student" />;
}

function Journal({ studentId }: { studentId: string }) {
  const { items } = journalEntries.use();
  const mine = items.filter((e) => e.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>(null);
  const [share, setShare] = useState(false); // private by default
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function save() {
    if (!body.trim()) return;
    const ok = await journalEntries.add({ id: newId(), studentId, body: body.trim(), mood, shared: share, createdAt: new Date().toISOString() });
    setState(ok ? "saved" : "error");
    if (ok) {
      setBody("");
      setMood(null);
      setShare(false);
    }
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">My journal</h1>
        <p className="flex items-start gap-2 text-text-muted">
          <Lock aria-hidden size={18} className="mt-1 shrink-0" />
          Your journal is private. Only you can read it, unless you choose to share an entry with your counsellor.
        </p>
      </header>

      <div className="space-y-4 rounded-[18px] border border-separator bg-surface p-5">
        <label htmlFor="entry" className="font-semibold">
          Write something
        </label>
        <textarea id="entry" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000} className="w-full rounded-[12px] border border-border p-3" />
        <fieldset>
          <legend className="mb-2 text-[16px] font-medium">How do you feel? (optional)</legend>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mood === value}
                onClick={() => setMood(mood === value ? null : value)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-[12px] bg-student-bg text-[14px] ${mood === value ? "font-semibold ring-3 ring-student-accent" : ""}`}
              >
                <Icon aria-hidden size={24} className="text-student-accent" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center justify-between gap-4">
          <span id="share-new">
            <span className="block font-medium">Share this entry with my counsellor</span>
            <span className="text-[15px] text-text-muted">{share ? "Your counsellor will be able to read it." : "Off: only you can read it."}</span>
          </span>
          <ShareSwitch shared={share} onChange={setShare} id="share-new" />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={!body.trim()} onClick={() => void save()} className="min-h-12 flex-1 rounded-[12px] bg-student-accent font-semibold text-white disabled:opacity-50">
            Save
          </button>
          <span role="status" aria-live="polite" className="text-[15px]">
            {state === "saved" && "Saved"}
            {state === "error" && "Didn't save. Please try again."}
          </span>
        </div>
      </div>

      {mine.length > 0 && (
        <ol className="space-y-3" aria-label="Your entries">
          {mine.map((e) => (
            <li key={e.id} className="space-y-3 rounded-[18px] border border-separator bg-surface p-5">
              <p className="text-[14px] text-text-muted">
                {formatTime(e.createdAt)}
                {e.mood ? ` · ${MOODS.find((m) => m.value === e.mood)?.label}` : ""}
              </p>
              <p className="whitespace-pre-wrap">{e.body}</p>
              <div className="flex items-center justify-between gap-3 border-t border-separator pt-3">
                <span id={`share-${e.id}`} className="inline-flex items-center gap-2 text-[15px]">
                  {e.shared ? <Users aria-hidden size={16} className="text-student-accent" /> : <Lock aria-hidden size={16} className="text-text-muted" />}
                  {e.shared ? "Shared with your counsellor" : "Private"}
                </span>
                <ShareSwitch shared={e.shared} onChange={(v) => void journalEntries.update(e.id, { shared: v })} id={`share-${e.id}`} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Goals({ studentId }: { studentId: string }) {
  const { items } = goalStore.use();
  const mine = items.filter((g) => g.studentId === studentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [title, setTitle] = useState("");

  async function add() {
    if (!title.trim()) return;
    if (await goalStore.add({ id: newId(), studentId, title: title.trim(), done: false, createdAt: new Date().toISOString() })) setTitle("");
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-[24px] font-semibold">My goals</h2>
        <p className="text-text-muted">{GOAL_ENCOURAGEMENT}</p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
        className="flex gap-2"
      >
        <label htmlFor="goal" className="sr-only">
          A new goal
        </label>
        <input id="goal" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Go to bed before 10" className="min-h-12 flex-1 rounded-[12px] border border-border bg-surface px-4" />
        <button type="submit" disabled={!title.trim()} className="inline-flex min-h-12 items-center gap-1 rounded-[12px] bg-student-accent px-5 font-semibold text-white disabled:opacity-50">
          <Plus aria-hidden size={18} /> Add
        </button>
      </form>
      {mine.length > 0 && (
        <ul className="divide-y divide-separator rounded-[18px] border border-separator bg-surface">
          {mine.map((g) => (
            <li key={g.id} className="flex items-center gap-3 px-4 py-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={g.done}
                onClick={() => void goalStore.update(g.id, { done: !g.done })}
                className="flex min-h-12 flex-1 items-center gap-3 text-left"
              >
                <span aria-hidden className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${g.done ? "border-student-accent bg-student-accent text-white" : "border-border"}`}>
                  {g.done && <Check size={16} />}
                </span>
                <span className={g.done ? "text-text-muted line-through" : ""}>{g.title}</span>
              </button>
              <button type="button" onClick={() => void goalStore.remove(g.id)} aria-label={`Remove goal: ${g.title}`} className="flex size-12 items-center justify-center rounded-full text-text-muted hover:bg-student-bg">
                <Trash2 aria-hidden size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
