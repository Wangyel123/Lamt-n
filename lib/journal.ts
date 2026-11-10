// K-04: a private journal and simple goals. PRIVATE BY DEFAULT.

export interface JournalEntry {
  id: string;
  studentId: string;
  body: string;
  mood: 1 | 2 | 3 | 4 | null;
  shared: boolean; // false unless the student turns on "Share this entry with my counsellor"
  createdAt: string;
}

export interface Goal {
  id: string;
  studentId: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/**
 * The ONLY journal entries a counsellor may ever see: the ones the student chose to share.
 * Live mode also enforces this in the database (RLS); demo mode relies on this function.
 */
export const visibleToCounsellor = (entries: JournalEntry[]) => entries.filter((e) => e.shared);

// Gentle, guilt-free encouragement. No streaks, no badges, no scores.
export const GOAL_ENCOURAGEMENT = "Small steps count. You can change or remove a goal any time.";
