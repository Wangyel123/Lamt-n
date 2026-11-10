import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "@/lib/activities";
import { visibleToCounsellor, type JournalEntry } from "@/lib/journal";
import { buildReadingQueue } from "@/lib/readingQueue";

const entry = (id: string, shared: boolean, body = "I want to hurt myself"): JournalEntry => ({ id, studentId: "S-012", body, mood: null, shared, createdAt: "2026-11-10" });

describe("journal is private by default (K-04)", () => {
  it("a counsellor can see ONLY entries the student chose to share", () => {
    expect(visibleToCounsellor([entry("1", false), entry("2", true), entry("3", false)]).map((e) => e.id)).toEqual(["2"]);
  });

  it("a private entry never reaches 'Needs reading', even with worrying words", () => {
    const sources = [entry("1", false), entry("2", true)].map((e) => ({
      sourceId: `journal:${e.id}`,
      studentId: e.studentId,
      at: e.createdAt,
      source: { kind: "journal" as const, text: e.body, shared: e.shared },
    }));
    expect(buildReadingQueue(sources, new Set()).map((i) => i.sourceId)).toEqual(["journal:2"]);
  });
});

describe("self-care activities (K-03)", () => {
  it("has 6–8 short activities, each 1–3 minutes with numbered steps", () => {
    expect(ACTIVITIES.length).toBeGreaterThanOrEqual(6);
    expect(ACTIVITIES.length).toBeLessThanOrEqual(8);
    for (const a of ACTIVITIES) {
      expect(a.minutes).toBeGreaterThanOrEqual(1);
      expect(a.minutes).toBeLessThanOrEqual(3);
      expect(a.steps.length).toBeGreaterThan(2);
    }
  });

  it("makes no medical claims", () => {
    const all = JSON.stringify(ACTIVITIES).toLowerCase();
    for (const word of ["cure", "treat", "diagnos", "therapy", "medic"]) expect(all).not.toContain(word);
  });
});
