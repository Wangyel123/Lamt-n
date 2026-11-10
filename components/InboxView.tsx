"use client";

import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useState } from "react";
import type { BoardRow } from "@/lib/board";
import { newId } from "@/lib/collectionStore";
import { formatTime } from "@/lib/format";
import { conversations, MESSAGE_MAX_LENGTH, type Message } from "@/lib/messages";
import { needsAlert, scanText } from "@/lib/sensitiveText";
import { messages as messageStore } from "@/lib/stores";
import { FlagBadge } from "./FlagBadge";

interface Props {
  rows: BoardRow[];
  messages: Message[];
  onOpenStudent: (studentId: string) => void;
}

// K-02, counsellor side: one conversation per student. The counsellor sees the student's ID,
// school, class and flag (counsellor-only context) and replies as themselves.
export function InboxView({ rows, messages, onOpenStudent }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const list = conversations(messages);
  const rowOf = (id: string) => rows.find((r) => r.student.studentId === id);
  const open = list.find((c) => c.studentId === openId);

  if (list.length === 0)
    return <p className="rounded-[14px] border border-separator bg-surface p-8 text-center font-medium">No messages yet. Students can write to you from their space.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <ul className={`divide-y divide-separator self-start overflow-hidden rounded-[14px] border border-separator bg-surface ${open ? "hidden md:block" : ""}`} aria-label="Conversations">
        {list.map((c) => {
          const row = rowOf(c.studentId);
          const urgentWords = c.messages.some((m) => m.sender === "student" && !m.readAt && needsAlert(scanText(m.body)));
          return (
            <li key={c.studentId}>
              <button
                type="button"
                onClick={() => setOpenId(c.studentId)}
                aria-current={c.studentId === openId}
                className={`flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left ${c.studentId === openId ? "bg-fill" : "hover:bg-bg"}`}
              >
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="tabular font-semibold">{c.studentId}</span>
                    {row && <FlagBadge level={row.flag.level} />}
                  </span>
                  <span className="block text-[13px] text-text-muted">
                    {row ? `${row.student.school} · Class ${row.student.className} · ` : ""}
                    {formatTime(c.lastAt)}
                  </span>
                  {urgentWords && <span className="block text-[13px] font-semibold text-urgent-ink">Please read now</span>}
                </span>
                {c.unread > 0 && <span className="tabular rounded-full bg-primary px-2 text-[12px] font-semibold text-white">{c.unread} new</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {open ? (
        <Conversation key={open.studentId} studentId={open.studentId} items={open.messages} onBack={() => setOpenId(null)} onOpenStudent={onOpenStudent} />
      ) : (
        <p className="hidden rounded-[14px] border border-separator bg-surface p-8 text-center text-text-muted md:block">Choose a conversation.</p>
      )}
    </div>
  );
}

function Conversation({ studentId, items, onBack, onOpenStudent }: { studentId: string; items: Message[]; onBack: () => void; onOpenStudent: (id: string) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(false);

  // Opening a conversation marks the student's messages as read (that's what clears the "new" count).
  useEffect(() => {
    const now = new Date().toISOString();
    for (const m of items) if (m.sender === "student" && !m.readAt) void messageStore.update(m.id, { readAt: now });
  }, [items]);

  async function reply() {
    const body = text.trim();
    if (!body) return;
    const ok = await messageStore.add({ id: newId(), studentId, sender: "counsellor", body, createdAt: new Date().toISOString(), readAt: null });
    setError(!ok);
    if (ok) setText("");
  }

  return (
    <section aria-label={`Conversation with ${studentId}`} className="space-y-3 rounded-[14px] border border-separator bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-1 font-medium text-primary md:hidden">
          <ArrowLeft aria-hidden size={16} /> All messages
        </button>
        <span className="tabular font-semibold">{studentId}</span>
        <button type="button" onClick={() => onOpenStudent(studentId)} className="min-h-11 px-2 font-medium text-primary">
          Open details
        </button>
      </div>
      <ol className="space-y-2">
        {items.map((m) => (
          <li key={m.id} className={`flex ${m.sender === "counsellor" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.sender === "counsellor" ? "bg-primary text-white" : "bg-fill"}`}>
              <p className="text-[12px] opacity-80">{m.sender === "counsellor" ? "You" : studentId} · {formatTime(m.createdAt)}</p>
              <p className="whitespace-pre-wrap text-[15px]">{m.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void reply();
        }}
        className="space-y-2"
      >
        <label htmlFor="reply" className="sr-only">
          Reply to {studentId}
        </label>
        <textarea id="reply" value={text} maxLength={MESSAGE_MAX_LENGTH} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Write a reply" className="w-full rounded-[10px] border border-border p-3 text-[15px]" />
        {error && <p role="alert" className="text-[13px] font-semibold text-urgent-ink">Couldn&apos;t send. Try again.</p>}
        <button type="submit" disabled={!text.trim()} className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          <Send aria-hidden size={16} /> Send reply
        </button>
      </form>
    </section>
  );
}
