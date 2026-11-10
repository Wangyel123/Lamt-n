"use client";

import { KeyRound, Printer } from "lucide-react";
import { useState } from "react";
import { codeStatus, type AccessCode } from "@/lib/accessCodes";
import { useAccessCodes } from "@/lib/accessCodeStore";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/**
 * Opens a printable slip in a new window. The slip has the code and where to go, and only the
 * student ID (no name) so the counsellor knows whose slip it is when handing it out.
 * The code only ever contains safe letters/digits, so writing it into the page is safe.
 */
function printSlip(code: AccessCode) {
  const w = window.open("", "_blank", "width=420,height=520");
  if (!w) return;
  const url = `${window.location.origin}/student`;
  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Code for ${code.studentId}</title>
  <style>body{font-family:-apple-system,system-ui,sans-serif;margin:32px;color:#1c1c1e}
  .slip{border:2px dashed #8e8e93;border-radius:16px;padding:24px;max-width:320px}
  .code{font:700 34px ui-monospace,monospace;letter-spacing:.12em;margin:8px 0 16px}
  p{margin:6px 0;font-size:15px}.muted{color:#636366;font-size:13px}</style></head>
  <body><div class="slip"><p><strong>Your private code</strong></p><div class="code">${code.code}</div>
  <p>Go to: <strong>${url}</strong></p><p>Works once, until ${dateFormat.format(new Date(code.expiresAt))}.</p>
  <p>Please don't share it. You never need to type your name.</p><p class="muted">For: ${code.studentId}</p></div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

// K-01, counsellor side: make, print and revoke a student's one-time code (in the detail sheet).
export function AccessCodePanel({ studentId }: { studentId: string }) {
  const { codes, ready, loadError, create, revoke } = useAccessCodes();
  const [message, setMessage] = useState<string | null>(null);
  const mine = codes.filter((c) => c.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = mine.find((c) => codeStatus(c) === "active");
  const lastUsed = mine.find((c) => c.usedAt);

  async function makeCode() {
    setMessage(null);
    const code = await create(studentId);
    if (!code) setMessage("Couldn't make a code. Try again.");
  }

  if (loadError) return <p className="p-4 text-[15px] text-text-muted">Couldn&apos;t load codes. Refresh to try again.</p>;

  return (
    <div className="space-y-3 p-4">
      <p className="text-[15px] text-text-muted">
        The student types this code at the student page to reach their private space. No name or password needed.
      </p>
      {active ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-[28px] font-semibold tracking-[0.12em]">{active.code}</span>
            <span className="text-[13px] text-text-muted">Works once · until {dateFormat.format(new Date(active.expiresAt))}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => printSlip(active)} className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-4 font-medium text-white hover:bg-primary-hover">
              <Printer aria-hidden size={16} /> Print slip
            </button>
            <button type="button" onClick={() => void makeCode()} className="min-h-11 rounded-[10px] border border-separator-strong bg-surface px-4 font-medium hover:bg-fill">
              New code
            </button>
            <button
              type="button"
              onClick={async () => setMessage((await revoke(active.code)) ? "Code revoked. It no longer works." : "Couldn't revoke. Try again.")}
              className="min-h-11 rounded-[10px] px-4 font-medium text-urgent-ink hover:bg-fill"
            >
              Revoke
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!ready}
          onClick={() => void makeCode()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          <KeyRound aria-hidden size={16} /> Make a code
        </button>
      )}
      {lastUsed && <p className="text-[13px] text-text-muted">Last signed in with a code on {dateFormat.format(new Date(lastUsed.usedAt!))}.</p>}
      {message && (
        <p role="status" className="text-[13px] text-text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
