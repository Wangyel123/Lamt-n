import { describe, expect, it } from "vitest";
import { COMMENT_KEYWORDS, flagStudent, countByLevel } from "@/lib/flags";
import { buildReadingQueue, chipsByStudent } from "@/lib/readingQueue";
import { FLAG_RAISING_WORDS, matchWords, needsAlert, scanForCounsellor, scanText } from "@/lib/sensitiveText";
import { loadDataset } from "./helpers";

describe("categories (P-02)", () => {
  it("finds each category in plain sentences", () => {
    expect(scanText("Sometimes I don't want to go home").map((m) => m.category)).toEqual(["home_safety"]);
    expect(scanText("Some boys bullied me again").map((m) => m.category)).toEqual(["bullying"]);
    expect(scanText("My uncle hit me").map((m) => m.category)).toEqual(["abuse_violence"]);
    expect(scanText("I feel so lonely").map((m) => m.category)).toEqual(["distress"]);
    expect(scanText("I want to hurt myself").map((m) => m.category)).toEqual(["self_harm"]);
  });

  it("can find several categories at once, with a plain-language label", () => {
    const m = scanText("They hit me and I'm scared at home");
    expect(m.map((x) => x.category)).toEqual(["abuse_violence", "home_safety", "distress"]);
    expect(m[1].label).toBe("May mention not feeling safe at home");
  });

  it("ignores case and curly apostrophes from phones", () => {
    expect(scanText("SOMETIMES I DON’T WANT TO GO HOME").map((m) => m.category)).toEqual(["home_safety"]);
  });

  it("matches whole words only: 'hit' is not in 'white' or 'this'", () => {
    expect(matchWords("This white shirt is mine", ["hit"])).toEqual([]);
    expect(matchWords("He hit the wall", ["hit"])).toEqual(["hit"]);
    expect(matchWords("I like skill-building", ["kill"])).toEqual([]);
  });

  it("finds nothing in ordinary comments from the dataset", () => {
    for (const c of ["Exams are stressful", "I miss my mother who works abroad", "I get tired walking to school", "My friends help me a lot"]) {
      expect(scanText(c)).toEqual([]);
    }
  });

  it("only self-harm and abuse/violence raise an immediate alert", () => {
    expect(needsAlert(scanText("I want to hurt myself"))).toBe(true);
    expect(needsAlert(scanText("My uncle hit me"))).toBe(true);
    expect(needsAlert(scanText("I feel lonely"))).toBe(false);
  });
});

describe("private journals are NEVER scanned", () => {
  const worrying = "I want to hurt myself";

  it("a private (unshared) journal entry produces no matches, even with worrying words", () => {
    expect(scanForCounsellor({ kind: "journal", text: worrying, shared: false })).toEqual([]);
  });

  it("the same words in an entry the student CHOSE to share are found", () => {
    expect(scanForCounsellor({ kind: "journal", text: worrying, shared: true }).map((m) => m.category)).toEqual(["self_harm"]);
  });

  it("messages and comments are scanned", () => {
    expect(scanForCounsellor({ kind: "message", text: worrying })).toHaveLength(1);
    expect(scanForCounsellor({ kind: "survey_comment", text: worrying })).toHaveLength(1);
  });
});

describe("flag levels are unchanged by the new categories", () => {
  it("E2 still uses exactly the Phase 1 word list", () => {
    expect(COMMENT_KEYWORDS).toBe(FLAG_RAISING_WORDS);
    expect(FLAG_RAISING_WORDS).toEqual(["home", "hit", "hurt", "scared", "afraid", "unsafe", "alone", "die", "kill", "beat"]);
  });

  it("the brief's counts still hold: 2/17/17/36 with extra rules", () => {
    const { students } = loadDataset();
    expect(countByLevel(students.map((s) => flagStudent(s)))).toEqual({ Urgent: 2, High: 17, Review: 17, None: 36 });
  });
});

describe("Needs reading queue", () => {
  const sources = [
    { sourceId: "survey:S-023", studentId: "S-023", at: null, source: { kind: "survey_comment" as const, text: "Sometimes I don't want to go home" } },
    { sourceId: "survey:S-001", studentId: "S-001", at: null, source: { kind: "survey_comment" as const, text: "Nothing to add" } },
    { sourceId: "journal:1", studentId: "S-012", at: "2026-11-10", source: { kind: "journal" as const, text: "I want to hurt myself", shared: false } },
    { sourceId: "message:1", studentId: "S-012", at: "2026-11-10", source: { kind: "message" as const, text: "my uncle hit me" } },
  ];

  it("lists only matching, unread items, and never the private journal entry", () => {
    const q = buildReadingQueue(sources, new Set());
    expect(q.map((i) => i.sourceId)).toEqual(["survey:S-023", "message:1"]);
    expect(q[1].alert).toBe(true); // violence → alert
    expect(q[0].alert).toBe(false);
  });

  it("'Mark as read' clears an item so the chip doesn't nag", () => {
    expect(buildReadingQueue(sources, new Set(["survey:S-023"])).map((i) => i.sourceId)).toEqual(["message:1"]);
  });

  it("gives short category names per student for the row chip", () => {
    expect(chipsByStudent(buildReadingQueue(sources, new Set())).get("S-023")).toEqual(["safety at home"]);
  });
});
