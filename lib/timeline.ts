// One timeline per student in the detail sheet: follow-up changes, interventions, messages
// (metadata only, never content) and check-in responses, newest first. Pure function.

import type { FollowUp } from "./followUps";
import { STATUS_LABELS } from "./followUps";
import { INTERVENTION_TYPES, OUTCOMES, type Intervention } from "./interventions";

export interface TimelineEntry {
  at: string;
  kind: "status" | "intervention" | "message" | "checkin" | "journal";
  title: string;
  detail?: string;
}

export interface TimelineInputs {
  followUp?: FollowUp;
  interventions?: Intervention[];
  messages?: { createdAt: string; sender: "student" | "counsellor" }[];
  checkIns?: { createdAt: string; summary: string }[];
  sharedJournal?: { createdAt: string }[];
}

export function buildTimeline(input: TimelineInputs): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const e of input.followUp?.history ?? []) {
    entries.push({
      at: e.at,
      kind: "status",
      title: e.from ? `Follow-up: ${STATUS_LABELS[e.from]} → ${STATUS_LABELS[e.to]}` : `Follow-up started: ${STATUS_LABELS[e.to]}`,
      detail: e.note || undefined,
    });
  }
  for (const i of input.interventions ?? []) {
    entries.push({ at: i.createdAt, kind: "intervention", title: INTERVENTION_TYPES[i.type], detail: [OUTCOMES[i.outcome], i.notes].filter(Boolean).join(" · ") });
  }
  // Messages: WHEN only. The words stay in the conversation, not in the timeline.
  for (const m of input.messages ?? []) {
    entries.push({ at: m.createdAt, kind: "message", title: m.sender === "student" ? "Student sent a message" : "You replied" });
  }
  for (const c of input.checkIns ?? []) entries.push({ at: c.createdAt, kind: "checkin", title: "Check-in answered", detail: c.summary });
  for (const j of input.sharedJournal ?? []) entries.push({ at: j.createdAt, kind: "journal", title: "Shared a journal entry with you" });
  return entries.sort((a, b) => b.at.localeCompare(a.at));
}
