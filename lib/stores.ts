"use client";

// Every Phase 2 collection in one place. Each line says: where it lives in demo mode (a
// localStorage key), which Supabase table it uses in live mode, and how rows map to objects.
// Who may read or write each table is decided by its RLS policies (supabase/migrations/003_*.sql).

import { createCollection } from "./collectionStore";
import type { Intervention, InterventionOutcome, InterventionType } from "./interventions";

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
