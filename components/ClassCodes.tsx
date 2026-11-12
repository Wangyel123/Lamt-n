"use client";

import { Check, KeyRound, Printer } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { compareClasses } from "@/lib/classOrder";
import { codeStatus, SLIP_LINES, type AccessCode, type CodeStatus } from "@/lib/accessCodes";
import { useAccessCodes } from "@/lib/accessCodeStore";
import { ui } from "@/lib/ui";

interface RosterRow {
  studentId: string;
  school: string;
  className: string;
}

const noSubscribe = () => () => {};
const studentUrl = () => `${window.location.origin}/student`;

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** The newest code that isn't revoked, and what it means for this student. */
function current(codes: AccessCode[], studentId: string): { code: AccessCode | null; status: CodeStatus | null } {
  const code = codes.filter((c) => c.studentId === studentId && !c.revokedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  return { code, status: code ? codeStatus(code) : null };
}

const STATE_TEXT: Record<"ready" | "set_up" | "needs", string> = {
  set_up: "Set up (has a PIN)",
  ready: "Slip ready, not used yet",
  needs: "Needs a code",
};

// K-01 for a whole class: make the codes that are missing, then print every unused one as a slip.
// Students who already set a PIN are left alone (a new code would sign them out).
export function ClassCodes({ roster }: { roster: RosterRow[] }) {
  const { codes, ready, loadError, createMany } = useAccessCodes();
  const schools = [...new Set(roster.map((r) => r.school))].sort();
  const [school, setSchool] = useState(schools[0] ?? "");
  const classes = [...new Set(roster.filter((r) => r.school === school).map((r) => r.className))].sort(compareClasses);
  const [chosenClass, setChosenClass] = useState("");
  const className = classes.includes(chosenClass) ? chosenClass : (classes[0] ?? "");
  const [busy, setBusy] = useState(false);
  const url = useSyncExternalStore(noSubscribe, studentUrl, () => "");
  const [message, setMessage] = useState<string | null>(null);

  const rows = roster
    .filter((r) => r.school === school && r.className === className)
    .sort((a, b) => a.studentId.localeCompare(b.studentId))
    .map((r) => {
      const { code, status } = current(codes, r.studentId);
      const state: keyof typeof STATE_TEXT = status === "in_use" ? "set_up" : status === "active" ? "ready" : "needs";
      return { ...r, code, state };
    });
  const needs = rows.filter((r) => r.state === "needs");
  const printable = rows.filter((r) => r.state === "ready" && r.code);

  async function makeMissing() {
    setBusy(true);
    setMessage(null);
    const made = await createMany(needs.map((r) => r.studentId));
    setBusy(false);
    setMessage(made === needs.length ? `Made ${made} ${made === 1 ? "code" : "codes"}.` : "Some codes couldn't be made. Try again.");
  }

  if (loadError) return <p className={`${ui.panel} p-6`}>Couldn&apos;t load codes. Refresh to try again.</p>;

  return (
    <>
      <div className="space-y-5 print:hidden">
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1">
            <span className={ui.label}>School</span>
            <select value={school} onChange={(e) => setSchool(e.target.value)} className={`${ui.select} w-48`}>
              {schools.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className={ui.label}>Class</span>
            <select value={className} onChange={(e) => setChosenClass(e.target.value)} className={`${ui.select} w-36`}>
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={!ready || busy || needs.length === 0} onClick={() => void makeMissing()} className={ui.primary}>
            <KeyRound aria-hidden size={16} />
            {needs.length === 0 ? "Everyone has a code" : `Make ${needs.length} ${needs.length === 1 ? "code" : "codes"}`}
          </button>
          <button type="button" disabled={printable.length === 0} onClick={() => window.print()} className={ui.secondary}>
            <Printer aria-hidden size={16} />
            Print {printable.length} {printable.length === 1 ? "slip" : "slips"}
          </button>
          <p role="status" aria-live="polite" className="text-[13px] text-text-muted">
            {!ready ? "Loading codes…" : message}
          </p>
        </div>

        <ul className={`divide-y divide-separator ${ui.panel}`} aria-label={`Class ${className}, ${school}`}>
          {rows.map((r) => (
            <li key={r.studentId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="font-mono font-semibold">{r.studentId}</span>
              <span className={`flex items-center gap-1.5 text-[14px] ${r.state === "needs" ? "font-medium" : "text-text-muted"}`}>
                {r.state === "set_up" && <Check aria-hidden size={16} className="text-primary" />}
                {STATE_TEXT[r.state]}
                {r.state === "ready" && r.code && <span className="font-mono"> · {r.code.code}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-text-muted">
          A student who forgot their PIN or lost their slip: open them on the board and choose &ldquo;New code (forgot PIN)&rdquo;.
        </p>
      </div>

      {/* The printed sheet: one slip per unused code, cut along the dashes. Only appears on paper. */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-4">
        {printable.map((r) => (
          <div key={r.studentId} className="break-inside-avoid rounded-[12px] border-2 border-dashed border-border p-4 text-[12px] text-black">
            <p className="font-semibold">{SLIP_LINES.heading}</p>
            <p className="my-1 font-mono text-[26px] font-bold tracking-[0.12em]">{r.code!.code}</p>
            <p>
              Go to: <strong>{url}</strong>
            </p>
            <p>{SLIP_LINES.firstTime}</p>
            <p>{SLIP_LINES.nextTime}</p>
            <p>{SLIP_LINES.private}</p>
            <p className="mt-1 text-[11px] text-text-muted">
              For: {r.studentId} · Class {r.className} · first use by {dateFormat.format(new Date(r.code!.expiresAt))}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
