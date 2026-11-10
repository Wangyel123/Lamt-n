"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/collectionStore";
import { formatTime } from "@/lib/format";
import { AWAY_NOTE, CARING_REPLY, EMPTY_STATE, isWithinCounsellorHours, MESSAGE_MAX_LENGTH, REPLY_NOTE, RIGHT_NOW_NOTE, underRateLimit } from "@/lib/messages";
import { needsAlert, scanText } from "@/lib/sensitiveText";
import { messages } from "@/lib/stores";
import { SignedInOnly } from "./SignedInOnly";

// K-02, student side. A real person (their school counsellor) reads and replies. Any automatic
// text here is fixed wording written in advance: never AI.
export function StudentMessages({ liveStudentId }: { liveStudentId?: string }) {
  return <SignedInOnly liveStudentId={liveStudentId}>{(studentId) => <Chat studentId={studentId} />}</SignedInOnly>;
}

function Chat({ studentId }: { studentId: string }) {
  const { items, ready, loadError } = messages.use();
  const mine = items.filter((m) => m.studentId === studentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "limit">("idle");
  const [showCaring, setShowCaring] = useState(false);
  const away = !isWithinCounsellorHours();

  async function send() {
    const body = text.trim();
    if (!body) return;
    if (!underRateLimit(items, studentId)) return setStatus("limit");
    setStatus("sending");
    const ok = await messages.add({ id: newId(), studentId, sender: "student", body, createdAt: new Date().toISOString(), readAt: null });
    if (!ok) return setStatus("error");
    setText("");
    setStatus("idle");
    // If the words suggest danger, show a fixed, caring message straight away. The counsellor is alerted on their board.
    if (needsAlert(scanText(body))) setShowCaring(true);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Talk to my counsellor</h1>
        <p className="text-text-muted">A private space to write to your school counsellor. Only they read it.</p>
      </header>

      {loadError && <p role="alert">We couldn&apos;t load your messages. Please try again in a moment.</p>}

      <ol aria-label="Messages" className="space-y-3">
        {ready && mine.length === 0 && <li>{EMPTY_STATE}</li>}
        {mine.map((m) => (
          <li key={m.id} className={`flex ${m.sender === "student" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-[18px] px-4 py-3 ${m.sender === "student" ? "bg-student-accent text-white" : "bg-surface"}`}>
              <p className="text-[13px] opacity-80">{m.sender === "student" ? "You" : "Your counsellor"} · {formatTime(m.createdAt)}</p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {showCaring && (
        <p role="status" className="rounded-[18px] border-2 border-student-accent bg-surface p-5">
          {CARING_REPLY}
        </p>
      )}

      <form
        className="space-y-3 rounded-[18px] border border-separator bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="message" className="font-semibold">
          Write a message
        </label>
        <textarea
          id="message"
          value={text}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          autoComplete="off"
          className="w-full rounded-[12px] border border-border bg-surface p-3"
        />
        {status === "error" && <p role="alert">Your message didn&apos;t send. Please try again.</p>}
        {status === "limit" && <p role="alert">You&apos;ve sent a lot of messages this hour. Please wait a little, or tap Get help now.</p>}
        <button
          type="submit"
          disabled={!text.trim() || status === "sending"}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-student-accent font-semibold text-white disabled:opacity-50"
        >
          <Send aria-hidden size={18} /> {status === "sending" ? "Sending…" : "Send"}
        </button>
        <div className="space-y-1 pt-1 text-[16px] text-text-muted">
          <p>{away ? AWAY_NOTE : REPLY_NOTE}</p>
          <p>{RIGHT_NOW_NOTE}</p>
        </div>
      </form>
    </div>
  );
}
