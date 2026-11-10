import { describe, expect, it } from "vitest";
import { CARING_REPLY, conversations, isWithinCounsellorHours, STUDENT_MESSAGES_PER_HOUR, underRateLimit, type Message } from "@/lib/messages";

const msg = (studentId: string, sender: Message["sender"], at: string, readAt: string | null = null): Message => ({
  id: `${studentId}-${at}-${sender}`,
  studentId,
  sender,
  body: "hello",
  createdAt: at,
  readAt,
});

describe("messaging (K-02)", () => {
  it("counsellor hours: Monday–Friday 9:00–16:00 (local time)", () => {
    expect(isWithinCounsellorHours(new Date(2026, 10, 10, 10, 0))).toBe(true); // Tuesday 10:00
    expect(isWithinCounsellorHours(new Date(2026, 10, 10, 17, 0))).toBe(false); // Tuesday 17:00
    expect(isWithinCounsellorHours(new Date(2026, 10, 14, 10, 0))).toBe(false); // Saturday
  });

  it(`rate limit: ${STUDENT_MESSAGES_PER_HOUR} student messages per hour`, () => {
    const now = new Date("2026-11-10T10:00:00Z");
    const recent = Array.from({ length: STUDENT_MESSAGES_PER_HOUR }, (_, i) => msg("S-012", "student", new Date(now.getTime() - i * 60000).toISOString()));
    expect(underRateLimit(recent, "S-012", now)).toBe(false);
    expect(underRateLimit(recent.slice(1), "S-012", now)).toBe(true);
    expect(underRateLimit(recent, "S-013", now)).toBe(true); // other students unaffected
  });

  it("inbox: one conversation per student, unread first, then most recent", () => {
    const list = conversations([
      msg("S-001", "student", "2026-11-10T09:00:00Z", "2026-11-10T09:30:00Z"),
      msg("S-002", "student", "2026-11-09T09:00:00Z"),
      msg("S-001", "counsellor", "2026-11-10T09:40:00Z"),
    ]);
    expect(list.map((c) => [c.studentId, c.unread])).toEqual([
      ["S-002", 1],
      ["S-001", 0],
    ]);
    expect(list[1].messages.map((m) => m.sender)).toEqual(["student", "counsellor"]);
  });

  it("the caring reply is fixed text that points to real help", () => {
    expect(CARING_REPLY).toContain("trusted adult");
    expect(CARING_REPLY).toContain("Get help now");
  });
});
