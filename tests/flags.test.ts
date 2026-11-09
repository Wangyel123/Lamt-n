import { describe, expect, it } from "vitest";
import { countByLevel, findCommentKeywords, flagStudent, type FlagLevel } from "@/lib/flags";
import { findStudent, loadDataset, makeStudent } from "./helpers";

const { students } = loadDataset();
const baseline = students.map((s) => ({ id: s.studentId, ...flagStudent(s, { useExtraRules: false }) }));
const withExtras = students.map((s) => ({ id: s.studentId, ...flagStudent(s, { useExtraRules: true }) }));
const idsAt = (results: typeof baseline, level: FlagLevel) => results.filter((r) => r.level === level).map((r) => r.id);

describe("baseline rules on the dataset (section 5.4)", () => {
  it("gives Urgent 2 · High 9 · Review 17 · None 44", () => {
    expect(countByLevel(baseline)).toEqual({ Urgent: 2, High: 9, Review: 17, None: 44 });
  });

  it("flags exactly S-005 and S-038 as Urgent", () => {
    expect(idsAt(baseline, "Urgent")).toEqual(["S-005", "S-038"]);
  });

  it("flags exactly the expected 9 students as High", () => {
    expect(idsAt(baseline, "High")).toEqual([
      "S-001", "S-002", "S-014", "S-020", "S-025", "S-045", "S-049", "S-068", "S-070",
    ]);
  });
});

describe("baseline + extra rules on the dataset (section 5.4)", () => {
  it("gives Urgent 2 · High 17 · Review 17 · None 36", () => {
    expect(countByLevel(withExtras)).toEqual({ Urgent: 2, High: 17, Review: 17, None: 36 });
  });

  it("changes exactly these 9 students, and only upwards", () => {
    const changes = withExtras
      .filter((r) => r.level !== r.baselineLevel)
      .map((r) => `${r.id} ${r.baselineLevel}→${r.level}`);
    expect(changes).toEqual([
      "S-016 Review→High",
      "S-023 None→Review",
      "S-027 None→High",
      "S-029 None→High",
      "S-047 None→High",
      "S-051 None→High",
      "S-052 None→High",
      "S-055 None→High",
      "S-058 None→High",
    ]);
  });

  it("never lowers anyone's level", () => {
    const order: FlagLevel[] = ["Urgent", "High", "Review", "None"];
    for (const r of withExtras) {
      expect(order.indexOf(r.level)).toBeLessThanOrEqual(order.indexOf(r.baselineLevel));
    }
  });
});

describe("known data issues (section 4)", () => {
  it('S-045 ("often" in lowercase) is High, not None', () => {
    const r = flagStudent(findStudent(students, "S-045"), { useExtraRules: false });
    expect(r.level).toBe("High");
    expect(r.reasons[0]).toMatchObject({ text: "Bullied often", primary: true });
  });

  it("S-010 (blank sleep) is marked Needs check; the blank is not counted as sleeping poorly or well", () => {
    const r = flagStudent(findStudent(students, "S-010"));
    expect(r.needsCheck).toBe(true);
    expect(r.reasons.map((x) => x.id)).toEqual(["noTrustedAdult"]); // no "Sleeps poorly"
    expect(r.level).toBe("None"); // only 1 of the 3 Review signals is known to be met
  });

  it("S-023 (comment about not wanting to go home) is None under baseline, Review with extras", () => {
    const s = findStudent(students, "S-023");
    expect(flagStudent(s, { useExtraRules: false }).level).toBe("None");
    const r = flagStudent(s, { useExtraRules: true });
    expect(r.level).toBe("Review");
    expect(r.reasons[0]).toMatchObject({ text: "Comment may need reading", primary: true, extra: true });
    expect(r.commentKeywords).toEqual(["home"]);
  });

  it.each(["S-016", "S-027", "S-029", "S-047", "S-051", "S-052", "S-055", "S-058"])(
    '%s ("Prefer not to say") is at least High with extras, with the gentle reason first',
    (id) => {
      const r = flagStudent(findStudent(students, id));
      expect(r.level).toBe("High");
      expect(r.reasons[0]).toMatchObject({ id: "skippedSelfHarm", primary: true, extra: true });
    },
  );

  it("7 of the 8 'Prefer not to say' students are None under the pure baseline (the gap we found)", () => {
    const skipped = students.filter((s) => s.q6SelfHarm === "Prefer not to say");
    const none = skipped.filter((s) => flagStudent(s, { useExtraRules: false }).level === "None");
    expect(none).toHaveLength(7);
  });
});

describe("each baseline rule on its own", () => {
  it("everything fine → None, no reasons", () => {
    const r = flagStudent(makeStudent());
    expect(r.level).toBe("None");
    expect(r.reasons).toEqual([]);
    expect(r.needsCheck).toBe(false);
  });

  it("q6 = Yes → Urgent, even if everything else is fine", () => {
    expect(flagStudent(makeStudent({ q6SelfHarm: "Yes" })).level).toBe("Urgent");
  });

  it("q3 = Often → High", () => {
    expect(flagStudent(makeStudent({ q3Bullied: "Often" })).level).toBe("High");
  });

  it("q2 = 1 → High, but q2 = 2 is not", () => {
    expect(flagStudent(makeStudent({ q2SafeAtHome: 1 })).level).toBe("High");
    expect(flagStudent(makeStudent({ q2SafeAtHome: 2 })).level).toBe("None");
  });

  it("q7 = Yes alone → Review", () => {
    expect(flagStudent(makeStudent({ q7WantsCounsellor: "Yes" })).level).toBe("Review");
  });

  it("one Review signal alone → None, but it is still shown as a (non-primary) reason", () => {
    const r = flagStudent(makeStudent({ q1SleepWell: 2 }));
    expect(r.level).toBe("None");
    expect(r.reasons).toEqual([{ id: "sleepsPoorly", text: "Sleeps poorly", primary: false, extra: false }]);
  });

  it.each([
    ["sleep ≤ 2 + sad", { q1SleepWell: 1, q5SadMostDays: "Yes" as const }],
    ["sleep ≤ 2 + no trusted adult", { q1SleepWell: 2, q4TrustedAdult: "No" as const }],
    ["sad + no trusted adult", { q5SadMostDays: "Yes" as const, q4TrustedAdult: "No" as const }],
  ])("any two Review signals → Review (%s)", (_label, overrides) => {
    const r = flagStudent(makeStudent(overrides));
    expect(r.level).toBe("Review");
    expect(r.reasons.every((x) => x.primary)).toBe(true);
  });

  it("q1 = 3 does not count as sleeping poorly", () => {
    expect(flagStudent(makeStudent({ q1SleepWell: 3, q5SadMostDays: "Yes" })).level).toBe("None");
  });

  it("first matching rule wins, but ALL reasons are shown with the primary one first", () => {
    const r = flagStudent(
      makeStudent({ q6SelfHarm: "Yes", q3Bullied: "Often", q5SadMostDays: "Yes", q4TrustedAdult: "No" }),
    );
    expect(r.level).toBe("Urgent");
    expect(r.reasons.map((x) => [x.text, x.primary])).toEqual([
      ["Said yes to thoughts of self-harm", true],
      ["Bullied often", false],
      ["Feels sad most days", false],
      ["No trusted adult to talk to", false],
    ]);
  });

  it("both High conditions met → both are primary", () => {
    const r = flagStudent(makeStudent({ q3Bullied: "Often", q2SafeAtHome: 1 }));
    expect(r.reasons.filter((x) => x.primary).map((x) => x.id)).toEqual(["bulliedOften", "neverSafeAtHome"]);
  });

  it("missing answers never trigger a rule", () => {
    const r = flagStudent(
      makeStudent({ q1SleepWell: null, q2SafeAtHome: null, q3Bullied: null, q6SelfHarm: null, dataIssues: ["x"] }),
    );
    expect(r.level).toBe("None");
    expect(r.needsCheck).toBe(true);
  });
});

describe("extra rules", () => {
  it("E1 does not raise an Urgent student, and its reason is shown as secondary", () => {
    // Can't have both Yes and Prefer not to say, so check E1 on a student already High.
    const r = flagStudent(makeStudent({ q6SelfHarm: "Prefer not to say", q3Bullied: "Often" }));
    expect(r.level).toBe("High");
    expect(r.reasons.find((x) => x.id === "bulliedOften")?.primary).toBe(true);
    expect(r.reasons.find((x) => x.id === "skippedSelfHarm")?.primary).toBe(false);
  });

  it("E2 does not lower or change a High student", () => {
    const r = flagStudent(makeStudent({ q3Bullied: "Often", comment: "I am scared" }));
    expect(r.level).toBe("High");
  });

  it("with extras off, extra reasons are hidden entirely", () => {
    const r = flagStudent(makeStudent({ q6SelfHarm: "Prefer not to say", comment: "home" }), { useExtraRules: false });
    expect(r.level).toBe("None");
    expect(r.reasons).toEqual([]);
    expect(r.commentKeywords).toEqual([]);
  });

  it("keyword matching is whole-word and ignores case", () => {
    expect(findCommentKeywords("I feel SCARED and alone")).toEqual(["scared", "alone"]);
    expect(findCommentKeywords("Homework is hard")).toEqual([]); // "home" inside a word: no match
    expect(findCommentKeywords("I like this school")).toEqual([]);
    expect(findCommentKeywords("")).toEqual([]);
  });
});
