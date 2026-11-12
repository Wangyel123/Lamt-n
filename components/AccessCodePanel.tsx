"use client";

import { KeyRound, Printer } from "lucide-react";
import { useState } from "react";
import { codeStatus, KEY_LIFETIME_DAYS, SLIP_LINES, type AccessCode } from "@/lib/accessCodes";
import { useAccessCodes } from "@/lib/accessCodeStore";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Opens a printable slip in a new window. The slip has the code, where to go and how the PIN works,
 * and only the student ID (no name) so the counsellor knows whose slip it is when handing it out.
 * The code only ever contains safe letters/digits, so writing it into the page is safe.
 */
function printSlip(code: AccessCode) {
  const w = window.open("", "_blank", "width=420,height=560");
  if (!w) return;
  const url = `${window.location.origin}/student`;
  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Code for ${code.studentId}</title>
  <style>body{font-family:-apple-system,system-ui,sans-serif;margin:32px;color:#16191d}
  .slip{border:2px dashed #8c8880;border-radius:16px;padding:24px;max-width:320px}
  .code{font:700 34px ui-monospace,monospace;letter-spacing:.12em;margin:8px 0 16px}
  p{margin:6px 0;font-size:15px}.muted{color:#5b6067;font-size:13px}</style></head>
  <body><div class="slip"><p><strong>${SLIP_LINES.heading}</strong></p><div class="code">${code.code}</div>
  <p>Go to: <strong>${url}</strong></p><p>${SLIP_LINES.firstTime}</p><p>${SLIP_LINES.nextTime}</p>
  <p>${SLIP_LINES.private}</p><p class="muted">For: ${code.studentId}</p></div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

const button = "min-h-11 rounded-[10px] border border-separator-strong bg-surface px-4 font-medium hover:bg-fill";
const primary = "inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-50";

// K-01, counsellor side: the student's code (their key for the year), in the detail sheet.
// One code per student. Making a new one stops the old one and signs out every device that used it.
export function AccessCodePanel({ studentId }: { studentId: string }) {
  const { codes, ready, loadError, create, revoke } = useAccessCodes();
  const [message, setMessage] = useState<string | null>(null);
  const current = codes.filter((c) => c.studentId === studentId && !c.revokedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const status = current ? codeStatus(current) : null;

  async function makeCode(confirmFirst: boolean) {
    if (confirmFirst && !window.confirm("This stops the old code and PIN, and signs the student out on every device. Make a new code?")) return;
    setMessage(null);
    const code = await create(studentId);
    setMessage(code ? null : "Couldn't make a code. Try again.");
  }

  async function stop() {
    if (!current || !window.confirm("Stop this code? The student is signed out on every device and needs a new code to come back.")) return;
    setMessage((await revoke(current.code)) ? "Code stopped. Any device using it is signed out." : "Couldn't stop the code. Try again.");
  }

  if (loadError) return <p className="p-4 text-[15px] text-text-muted">Couldn&apos;t load codes. Refresh to try again.</p>;

  return (
    <div className="space-y-3 p-4">
      <p className="text-[15px] text-text-muted">
        The student types this code and chooses a 4-number PIN. After that, the same code and PIN work any time for{" "}
        {KEY_LIFETIME_DAYS === 365 ? "a year" : `${KEY_LIFETIME_DAYS} days`}. No name needed.
      </p>

      {current && (status === "active" || status === "in_use") && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-[28px] font-semibold tracking-[0.12em]">{current.code}</span>
            <span className="text-[13px] text-text-muted">
              {status === "active"
                ? `Not used yet · first use by ${dateFormat.format(new Date(current.expiresAt))}`
                : `Set up ${dateFormat.format(new Date(current.pinSetAt!))} · works until ${longDate.format(new Date(current.keyExpiresAt!))}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => printSlip(current)} className={primary}>
              <Printer aria-hidden size={16} /> {status === "active" ? "Print slip" : "Print slip again"}
            </button>
            <button type="button" onClick={() => void makeCode(status === "in_use")} className={button}>
              {status === "in_use" ? "New code (forgot PIN)" : "New code"}
            </button>
            <button type="button" onClick={() => void stop()} className="min-h-11 rounded-[10px] px-4 font-medium text-urgent-ink hover:bg-fill">
              Stop code
            </button>
          </div>
        </div>
      )}

      {status === "locked" && (
        <p className="font-medium">Locked after too many wrong PINs. Make a new code for this student.</p>
      )}

      {(!current || !(status === "active" || status === "in_use")) && (
        <button type="button" disabled={!ready} onClick={() => void makeCode(false)} className={primary}>
          <KeyRound aria-hidden size={16} /> {current ? "Make a new code" : "Make a code"}
        </button>
      )}

      {message && (
        <p role="status" className="text-[13px] text-text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
