"use client";

// Every Phase 2 collection in one place. Each line says: where it lives in demo mode (a
// localStorage key), which Supabase table it uses in live mode, and how rows map to objects.
// Who may read or write each table is decided by its RLS policies (supabase/migrations/003_*.sql).

import { createCollection } from "./collectionStore";
import type { Intervention, InterventionOutcome, InterventionType } from "./interventions";
import type { CheckIn, CheckInResponse, Feeling, QuestionId, Worry } from "./checkins";
import type { Message } from "./messages";

const str = (v: unknown) => (v == null ? "" : String(v));
const strOrNull = (v: unknown) => (v == null ? null : String(v));

// P-01: what the counsellor did. Counsellors only (their school). Supervisors see counts only, via the server.
export const interventions = createCollection<Intervention>({
  key: "sa-interventions-v1",
  table: "interventions",
  columns: "id, student_id, type, notes, outcome, follow_up_date, created_at",
  fromRow: (r) => ({
    id: str(r.id),
    studentId: str(r.student_id),
    type: r.type as InterventionType,
    notes: str(r.notes),
    outcome: r.outcome as InterventionOutcome,
    followUpDate: strOrNull(r.follow_up_date),
    createdAt: str(r.created_at),
  }),
  // created_at and created_by are set by the database (created_by = whoever is signed in)
  toRow: (i) => ({ id: i.id, student_id: i.studentId, type: i.type, notes: i.notes, outcome: i.outcome, follow_up_date: i.followUpDate }),
});

// P-02: which "Needs reading" items a counsellor has marked as read (who + when), so chips don't nag.
export interface TextReview {
  id: string;
  studentId: string;
  sourceId: string; // e.g. "survey:S-023", "message:<uuid>"
  reviewedAt: string;
}
export const textReviews = createCollection<TextReview>({
  key: "sa-text-reviews-v1",
  table: "text_reviews",
  columns: "id, student_id, source_id, reviewed_at",
  fromRow: (r) => ({ id: str(r.id), studentId: str(r.student_id), sourceId: str(r.source_id), reviewedAt: str(r.reviewed_at) }),
  toRow: (r) => ({ id: r.id, student_id: r.studentId, source_id: r.sourceId }), // reviewed_by/at set by the database
});

// K-02: messages between a student and their counsellor. Students: own rows only. Counsellors: their
// school. Supervisors: no access at all. Re-read every 25 s while open (simple, no realtime needed).
export const messages = createCollection<Message>({
  key: "sa-messages-v1",
  table: "messages",
  columns: "id, student_id, sender_role, body, created_at, read_at",
  pollMs: 25_000,
  fromRow: (r) => ({
    id: str(r.id),
    studentId: str(r.student_id),
    sender: r.sender_role as Message["sender"],
    body: str(r.body),
    createdAt: str(r.created_at),
    readAt: strOrNull(r.read_at),
  }),
  toRow: (m) => ({ id: m.id, student_id: m.studentId, sender_role: m.sender, body: m.body }), // created_at set by the database
  patchRow: (p) => ({ read_at: p.readAt }), // the only column anyone may change afterwards
});

// P-04: check-ins a counsellor sends, and students' answers. Students: only check-ins for their
// group and their own answers. Counsellors: their school. Supervisors: response RATES via the server.
export const checkIns = createCollection<CheckIn>({
  key: "sa-checkins-v1",
  table: "checkins",
  columns: "id, school, class, questions, created_at",
  fromRow: (r) => ({ id: str(r.id), school: str(r.school), className: strOrNull(r.class), questions: (r.questions as QuestionId[]) ?? [], createdAt: str(r.created_at) }),
  toRow: (c) => ({ id: c.id, school: c.school, class: c.className, questions: c.questions }),
});

export const checkInResponses = createCollection<CheckInResponse>({
  key: "sa-checkin-responses-v1",
  table: "checkin_responses",
  columns: "id, checkin_id, student_id, feeling, worry, comment, created_at",
  fromRow: (r) => ({
    id: str(r.id),
    checkInId: str(r.checkin_id),
    studentId: str(r.student_id),
    feeling: (r.feeling as Feeling | null) ?? null,
    worry: (r.worry as Worry | null) ?? null,
    comment: str(r.comment),
    createdAt: str(r.created_at),
  }),
  toRow: (r) => ({ id: r.id, checkin_id: r.checkInId, student_id: r.studentId, feeling: r.feeling, worry: r.worry, comment: r.comment }),
});
