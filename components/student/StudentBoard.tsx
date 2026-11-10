"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/collectionStore";
import { formatTime } from "@/lib/format";
import { CARING_REPLY } from "@/lib/messages";
import { makeAlias, POST_MAX_LENGTH, postProblem, TOPICS, type Topic } from "@/lib/peerBoard";
import { needsAlert, scanText } from "@/lib/sensitiveText";
import { boardPosts } from "@/lib/stores";
import { useApprovedPosts } from "@/lib/useApprovedPosts";
import { SignedInOnly } from "./SignedInOnly";

const STATUS_TEXT = { pending: "Waiting for a counsellor to read it", approved: "On the board", rejected: "Not posted. Your counsellor may talk with you about it." };

// K-06, student side: share and read short, kind posts. A counsellor reads every post first.
export function StudentBoard({ liveStudentId }: { liveStudentId?: string }) {
  return <SignedInOnly liveStudentId={liveStudentId}>{(studentId) => <Board studentId={studentId} />}</SignedInOnly>;
}

function Board({ studentId }: { studentId: string }) {
  const approved = useApprovedPosts();
  const mine = boardPosts.use().items.filter((p) => p.studentId === studentId);
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [caring, setCaring] = useState(false);

  async function post() {
    const problem = postProblem(body);
    if (problem) return setMessage(problem);
    const ok = await boardPosts.add({ id: newId(), studentId, topic, body: body.trim(), alias: makeAlias(), status: "pending", createdAt: new Date().toISOString() });
    if (!ok) return setMessage("That didn't send. Please try again.");
    setCaring(needsAlert(scanText(body)));
    setBody("");
    setMessage("Sent. A counsellor will read it before it appears.");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Student board</h1>
        <p className="flex items-start gap-2 text-text-muted">
          <ShieldCheck aria-hidden size={18} className="mt-1 shrink-0" />
          A counsellor reads every post before anyone sees it. Your name and ID are never shown. No links or pictures.
        </p>
      </header>

      <section className="space-y-3" aria-label="Posts">
        {approved.length === 0 && <p className="rounded-[18px] border border-separator bg-surface p-5 text-text-muted">No posts yet.</p>}
        {approved.map((p) => (
          <article key={p.id} className="rounded-[18px] border border-separator bg-surface p-5">
            <p className="text-[14px] text-text-muted">
              {p.alias} · {p.topic} · {formatTime(p.createdAt)}
            </p>
            <p className="whitespace-pre-wrap">{p.body}</p>
          </article>
        ))}
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void post();
        }}
        className="space-y-3 rounded-[18px] border border-separator bg-surface p-5"
      >
        <h2 className="text-[22px] font-semibold">Share something kind or helpful</h2>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Topic</legend>
          {TOPICS.map((t) => (
            <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={`min-h-12 rounded-[12px] px-4 ${topic === t ? "bg-student-accent font-semibold text-white" : "bg-student-bg"}`}>
              {t}
            </button>
          ))}
        </fieldset>
        <label htmlFor="post" className="sr-only">
          Your post
        </label>
        <textarea id="post" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={POST_MAX_LENGTH} className="w-full rounded-[12px] border border-border p-3" />
        {message && <p role="status">{message}</p>}
        {caring && <p className="rounded-[12px] border-2 border-student-accent p-4">{CARING_REPLY}</p>}
        <button type="submit" disabled={!body.trim()} className="min-h-12 w-full rounded-[12px] bg-student-accent font-semibold text-white disabled:opacity-50">
          Send to the board
        </button>
      </form>

      {mine.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[22px] font-semibold">Your posts</h2>
          <ul className="divide-y divide-separator rounded-[18px] border border-separator bg-surface">
            {mine.map((p) => (
              <li key={p.id} className="px-5 py-3">
                <p className="whitespace-pre-wrap">{p.body}</p>
                <p className="text-[14px] text-text-muted">{STATUS_TEXT[p.status]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
