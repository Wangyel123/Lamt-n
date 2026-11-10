"use client";

import { Check, ShieldAlert, X } from "lucide-react";
import { formatTime } from "@/lib/format";
import { moderationAdvice, type BoardPost } from "@/lib/peerBoard";
import { KEYWORD_NOTICE, scanText } from "@/lib/sensitiveText";
import { boardPosts } from "@/lib/stores";

// K-06, counsellor side: every post waits here. Nothing is published without a counsellor's
// approval. A post that may mention self-harm or abuse can't be approved: follow up privately.
export function ModerationView({ posts, onOpenStudent }: { posts: BoardPost[]; onOpenStudent: (studentId: string) => void }) {
  const pending = posts.filter((p) => p.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (pending.length === 0) return <p className="rounded-2xl bg-surface p-8 text-center font-medium">No posts waiting. Nothing goes on the board without you.</p>;
  return (
    <section className="space-y-3">
      <p className="px-4 text-[15px] text-text-muted">{pending.length} posts waiting, oldest first. {KEYWORD_NOTICE}</p>
      <ul className="space-y-3">
        {pending.map((p) => {
          const matches = scanText(p.body);
          const privateFollowUp = moderationAdvice(p) === "follow_up_privately";
          return (
            <li key={p.id} className="space-y-3 rounded-2xl bg-surface p-4">
              <p className="text-[13px] text-text-muted">
                {p.alias} (shown to students) · {p.topic} · {formatTime(p.createdAt)} · from <span className="tabular font-medium text-text">{p.studentId}</span>
              </p>
              <p className="whitespace-pre-wrap">{p.body}</p>
              {matches.length > 0 && <p className="text-[13px] text-review-ink">{matches.map((m) => m.label).join(" · ")}</p>}
              {privateFollowUp ? (
                <div className="space-y-2 rounded-xl border-l-4 border-urgent bg-urgent-tint p-3">
                  <p className="flex items-center gap-2 font-semibold text-urgent-ink">
                    <ShieldAlert aria-hidden size={16} /> Don&apos;t publish. Follow up with this student privately.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onOpenStudent(p.studentId)} className="min-h-11 rounded-full bg-primary px-4 font-semibold text-white">
                      Open {p.studentId}
                    </button>
                    <button type="button" onClick={() => void boardPosts.update(p.id, { status: "rejected" })} className="min-h-11 rounded-full bg-surface px-4 font-medium">
                      Keep off the board
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void boardPosts.update(p.id, { status: "approved" })} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 font-semibold text-white">
                    <Check aria-hidden size={16} /> Approve
                  </button>
                  <button type="button" onClick={() => void boardPosts.update(p.id, { status: "rejected" })} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-fill px-4 font-medium">
                    <X aria-hidden size={16} /> Don&apos;t post
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
