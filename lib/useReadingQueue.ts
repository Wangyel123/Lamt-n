"use client";

// Gathers every piece of student text a counsellor may need to read, from every source, and
// what has already been marked as read. Sources are added here as Phase 2 features switch on.

import { newId } from "./collectionStore";
import type { Student } from "./parseCsv";
import { buildReadingQueue, chipsByStudent, type ReadingItem, type ReadingSource } from "./readingQueue";
import { textReviews } from "./stores";

export function useReadingQueue(students: Student[], extraSources: ReadingSource[] = []) {
  const reviews = textReviews.use();
  const surveyComments: ReadingSource[] = students
    .filter((s) => s.comment)
    .map((s) => ({ sourceId: `survey:${s.studentId}`, studentId: s.studentId, at: null, source: { kind: "survey_comment", text: s.comment } }));
  const readIds = new Set(reviews.items.map((r) => r.sourceId));
  // Until the "read" records have loaded, show nothing rather than chips that may already be cleared.
  const items = reviews.ready ? buildReadingQueue([...surveyComments, ...extraSources], readIds) : [];

  return {
    items,
    chips: chipsByStudent(items),
    reviews: reviews.items,
    markRead: (item: ReadingItem) =>
      textReviews.add({ id: newId(), studentId: item.studentId, sourceId: item.sourceId, reviewedAt: new Date().toISOString() }),
  };
}
