"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/collectionStore";
import { INTERVENTION_TYPES, OUTCOMES, type InterventionOutcome, type InterventionType } from "@/lib/interventions";
import { interventions } from "@/lib/stores";

const field = "min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-[15px]";

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <label className="block text-[15px] font-medium">
      {label}
      <span className="relative mt-1 block">
        <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`${field} appearance-none pr-9 font-normal`}>
          {(Object.keys(options) as T[]).map((k) => (
            <option key={k} value={k}>
              {options[k]}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted" />
      </span>
    </label>
  );
}

// P-01: log what you did for a student. Four fields at most, so it's quick to fill in after a meeting.
export function InterventionForm({ studentId }: { studentId: string }) {
  const [type, setType] = useState<InterventionType>("check_in_meeting");
  const [outcome, setOutcome] = useState<InterventionOutcome>("n/a");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function save() {
    const ok = await interventions.add({
      id: newId(),
      studentId,
      type,
      outcome,
      notes: notes.trim(),
      followUpDate: followUpDate || null,
      createdAt: new Date().toISOString(),
    });
    setState(ok ? "saved" : "error");
    if (ok) {
      setNotes("");
      setFollowUpDate("");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="What you did" value={type} options={INTERVENTION_TYPES} onChange={setType} />
        <Select label="How it went" value={outcome} options={OUTCOMES} onChange={setOutcome} />
      </div>
      <label className="block text-[15px] font-medium">
        Notes <span className="font-normal text-text-muted">(only counsellors see these)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${field} mt-1 py-2 font-normal`} />
      </label>
      <label className="block text-[15px] font-medium">
        Check in again on <span className="font-normal text-text-muted">(optional)</span>
        <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={`${field} mt-1 font-normal`} />
      </label>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void save()} className="min-h-11 rounded-full bg-primary px-5 font-semibold text-white">
          Add to timeline
        </button>
        <span role="status" aria-live="polite" className="text-[13px]">
          {state === "saved" && <span className="text-primary">Added</span>}
          {state === "error" && <span className="font-semibold text-urgent-ink">Couldn&apos;t save. Try again.</span>}
        </span>
      </div>
    </div>
  );
}
