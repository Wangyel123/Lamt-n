// K-02: "Talk to my counsellor": private, asynchronous messages between a student and a HUMAN
// counsellor. Pure functions and fixed wording. No AI ever writes to a student.

export interface Message {
  id: string;
  studentId: string;
  sender: "student" | "counsellor";
  body: string;
  createdAt: string;
  readAt: string | null; // when the counsellor opened a student's message
}

export const MESSAGE_MAX_LENGTH = 1000;
/** Light limit so a shared device can't be used to flood a counsellor. */
export const STUDENT_MESSAGES_PER_HOUR = 30;

// TODO(confirm with CECD): real counsellor hours and expected reply time for each school.
export const COUNSELLOR_HOURS = { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 16, label: "Monday to Friday, 9:00 to 16:00" };
export const REPLY_WITHIN_SCHOOL_DAYS = 2;

// Fixed, pre-written text. Shown to the student; never generated.
export const CARING_REPLY =
  "Thank you for telling us. Your counsellor will see this. If you are in danger now, please tell a trusted adult or use Get help now.";
export const AWAY_NOTE = `Your counsellor is away right now (${COUNSELLOR_HOURS.label}). They'll read your message when they're back. If you need help now, tap Get help now.`;
export const EMPTY_STATE = `Your counsellor usually replies within ${REPLY_WITHIN_SCHOOL_DAYS} school days. If you need help right now, tap Get help now.`;

export function isWithinCounsellorHours(now = new Date()): boolean {
  const hour = now.getHours();
  return COUNSELLOR_HOURS.days.includes(now.getDay()) && hour >= COUNSELLOR_HOURS.startHour && hour < COUNSELLOR_HOURS.endHour;
}

/** Can this student send another message right now? (live mode also enforces this in Postgres) */
export function underRateLimit(messages: Message[], studentId: string, now = new Date()): boolean {
  const hourAgo = now.getTime() - 60 * 60 * 1000;
  const recent = messages.filter((m) => m.studentId === studentId && m.sender === "student" && new Date(m.createdAt).getTime() > hourAgo);
  return recent.length < STUDENT_MESSAGES_PER_HOUR;
}

export interface Conversation {
  studentId: string;
  messages: Message[];
  unread: number; // student messages the counsellor hasn't opened
  lastAt: string;
}

/** Counsellor inbox: one conversation per student, unread first, then most recent. */
export function conversations(messages: Message[]): Conversation[] {
  const byStudent = new Map<string, Message[]>();
  for (const m of messages) byStudent.set(m.studentId, [...(byStudent.get(m.studentId) ?? []), m]);
  return [...byStudent.entries()]
    .map(([studentId, list]) => {
      const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return {
        studentId,
        messages: sorted,
        unread: sorted.filter((m) => m.sender === "student" && !m.readAt).length,
        lastAt: sorted[sorted.length - 1].createdAt,
      };
    })
    .sort((a, b) => Number(b.unread > 0) - Number(a.unread > 0) || b.lastAt.localeCompare(a.lastAt));
}
