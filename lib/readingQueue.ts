// P-02: "Needs reading". Every piece of student text that matched a sensitive category and that
// no counsellor has marked as read yet, from every source. Pure function, easy to test.

import { CATEGORIES, needsAlert, scanForCounsellor, type Match, type SensitiveCategory, type TextSource } from "./sensitiveText";

export interface ReadingSource {
  sourceId: string; // stable id, e.g. "survey:S-023" or "message:<uuid>"
  studentId: string;
  at: string | null; // when it was written (null for the survey comment)
  source: TextSource;
}

export interface ReadingItem extends ReadingSource {
  matches: Match[];
  alert: boolean; // self-harm or abuse/violence: shown in the alert banner
}

export const SOURCE_LABELS: Record<TextSource["kind"], string> = {
  survey_comment: "Survey comment",
  message: "Message",
  checkin: "Check-in comment",
  journal: "Shared journal entry",
  board_post: "Board post",
};

/** Unread items only (a counsellor's "Mark as read" clears them, so the chip doesn't nag). */
export function buildReadingQueue(sources: ReadingSource[], readIds: Set<string>): ReadingItem[] {
  return sources
    .filter((s) => !readIds.has(s.sourceId))
    .map((s) => {
      const matches = scanForCounsellor(s.source); // never scans a private journal entry
      return { ...s, matches, alert: needsAlert(matches) };
    })
    .filter((item) => item.matches.length > 0);
}

/** Short category names per student, for the chip on their row (e.g. "safety at home"). */
export function chipsByStudent(items: ReadingItem[]): Map<string, string[]> {
  const map = new Map<string, Set<SensitiveCategory>>();
  for (const item of items) {
    const set = map.get(item.studentId) ?? new Set<SensitiveCategory>();
    item.matches.forEach((m) => set.add(m.category));
    map.set(item.studentId, set);
  }
  return new Map([...map].map(([id, cats]) => [id, [...cats].map((c) => CATEGORIES[c].short)]));
}
