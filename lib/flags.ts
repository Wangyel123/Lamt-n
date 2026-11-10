// ALL flagging rules live in this one file, so any rule can be changed in under a minute.
//
// How it works:
//   1. CONDITIONS: small yes/no checks on one student's answers (e.g. "bullied often").
//   2. BASELINE RULES: the brief's rules, applied in order. The first match sets the level.
//   3. EXTRA RULES (our proposal, AC-08): can only RAISE a level, never lower it.
//   4. flagStudent(): runs everything and returns the level plus every reason.
//
// Flags are a screening aid for the counsellor, not a diagnosis.
// Flags are computed here (not stored in the database), so changing a rule
// changes the board straight away.

import type { Student } from "./parseCsv";
import { FLAG_RAISING_WORDS } from "./sensitiveText";

export type FlagLevel = "Urgent" | "High" | "Review" | "None";

/** Most serious first. Also used for sorting the board. */
export const FLAG_LEVELS: FlagLevel[] = ["Urgent", "High", "Review", "None"];

/** What the counsellor sees for each level. "None" reads as "No concerns", which is kinder and clearer. */
export const LEVEL_NAME: Record<FlagLevel, string> = {
  Urgent: "Urgent",
  High: "High",
  Review: "Review",
  None: "No concerns",
};

/**
 * One plain sentence per level saying which answers put a student there.
 * KEEP IN SYNC WITH THE RULES BELOW: if you change a rule, change its sentence here too.
 */
export function levelMeaning(level: FlagLevel, useExtraRules: boolean): string {
  switch (level) {
    case "Urgent":
      return "Said yes to thoughts of self-harm";
    case "High":
      return useExtraRules
        ? "Bullied often, never feels safe at home, or skipped the self-harm question"
        : "Bullied often, or never feels safe at home";
    case "Review":
      return useExtraRules
        ? "Several worrying answers, asked to see you, or a worrying comment"
        : "Several worrying answers, or asked to see you";
    case "None":
      return "No worrying answers in the survey";
  }
}

/** True if level `a` is less serious than level `b` (e.g. None is less serious than High). */
export function isLessSerious(a: FlagLevel, b: FlagLevel): boolean {
  return FLAG_LEVELS.indexOf(a) > FLAG_LEVELS.indexOf(b);
}

// ---------------------------------------------------------------------------
// 1. CONDITIONS
// A missing answer (null) NEVER meets a condition. We don't guess "fine" and we
// don't guess "at risk"; missing data is shown separately as "Needs check" (E3).
// ---------------------------------------------------------------------------

export const saidYesToSelfHarm = (s: Student) => s.q6SelfHarm === "Yes";
export const bulliedOften = (s: Student) => s.q3Bullied === "Often";
export const neverSafeAtHome = (s: Student) => s.q2SafeAtHome === 1;
export const sleepsPoorly = (s: Student) => s.q1SleepWell !== null && s.q1SleepWell <= 2;
export const sadMostDays = (s: Student) => s.q5SadMostDays === "Yes";
export const noTrustedAdult = (s: Student) => s.q4TrustedAdult === "No";
export const wantsCounsellor = (s: Student) => s.q7WantsCounsellor === "Yes";
// Extra-rule conditions (see section 3)
export const skippedSelfHarm = (s: Student) => s.q6SelfHarm === "Prefer not to say";
export const hasWorryingComment = (s: Student) => findCommentKeywords(s.comment).length > 0;

export type ConditionId =
  | "selfHarm"
  | "bulliedOften"
  | "neverSafeAtHome"
  | "sleepsPoorly"
  | "sadMostDays"
  | "noTrustedAdult"
  | "wantsCounsellor"
  | "skippedSelfHarm"
  | "worryingComment"
  | "checkInConcern";

// Plain, kind words the counsellor reads. Never codes like "q3".
export const REASON_TEXT: Record<ConditionId, string> = {
  selfHarm: "Said yes to thoughts of self-harm",
  bulliedOften: "Bullied often",
  neverSafeAtHome: "Never feels safe at home",
  sleepsPoorly: "Sleeps poorly",
  sadMostDays: "Feels sad most days",
  noTrustedAdult: "No trusted adult to talk to",
  wantsCounsellor: "Asked to see the counsellor",
  skippedSelfHarm: "Chose not to answer the self-harm question. Check in gently.",
  worryingComment: "Comment may need reading",
  checkInConcern: "Check-in: needs follow-up",
};

// Display order of reasons, and which conditions are our proposal (not the brief's).
const CONDITIONS: { id: ConditionId; check: (s: Student) => boolean; extra: boolean }[] = [
  { id: "selfHarm", check: saidYesToSelfHarm, extra: false },
  { id: "skippedSelfHarm", check: skippedSelfHarm, extra: true },
  { id: "bulliedOften", check: bulliedOften, extra: false },
  { id: "neverSafeAtHome", check: neverSafeAtHome, extra: false },
  { id: "sleepsPoorly", check: sleepsPoorly, extra: false },
  { id: "sadMostDays", check: sadMostDays, extra: false },
  { id: "noTrustedAdult", check: noTrustedAdult, extra: false },
  { id: "wantsCounsellor", check: wantsCounsellor, extra: false },
  { id: "worryingComment", check: hasWorryingComment, extra: true },
];

// ---------------------------------------------------------------------------
// 2. BASELINE RULES (exactly as the brief states). First match wins.
// ---------------------------------------------------------------------------

/** How many of (sleeps poorly, sad most days, no trusted adult) trigger Review. */
export const REVIEW_SIGNALS_NEEDED = 2;

export interface RuleOutcome {
  level: FlagLevel;
  triggeredBy: ConditionId[]; // the condition(s) that set this level
}

export function applyBaselineRules(s: Student): RuleOutcome {
  // Rule 1 — Urgent: q6 = Yes
  if (saidYesToSelfHarm(s)) return { level: "Urgent", triggeredBy: ["selfHarm"] };

  // Rule 2 — High: q3 = Often, or q2 = 1
  const high: ConditionId[] = [];
  if (bulliedOften(s)) high.push("bulliedOften");
  if (neverSafeAtHome(s)) high.push("neverSafeAtHome");
  if (high.length > 0) return { level: "High", triggeredBy: high };

  // Rule 3 — Review: any two of (q1 ≤ 2, q5 = Yes, q4 = No), or q7 = Yes
  const signals: ConditionId[] = [];
  if (sleepsPoorly(s)) signals.push("sleepsPoorly");
  if (sadMostDays(s)) signals.push("sadMostDays");
  if (noTrustedAdult(s)) signals.push("noTrustedAdult");
  const review: ConditionId[] = signals.length >= REVIEW_SIGNALS_NEEDED ? signals : [];
  if (wantsCounsellor(s)) review.push("wantsCounsellor");
  if (review.length > 0) return { level: "Review", triggeredBy: review };

  // Rule 4 — None: everything else
  return { level: "None", triggeredBy: [] };
}

// ---------------------------------------------------------------------------
// 3. EXTRA RULES — OUR PROPOSAL (AC-08), switchable on the board.
// They only ever RAISE a level. Turning them off gives the pure baseline.
// ---------------------------------------------------------------------------

// E2 keyword list. Matched as WHOLE words, ignoring case.
// This is a crude screen, NOT language understanding: "hurts" will not match "hurt",
// and "home" can appear in harmless comments. A person must read the comment.
// The list now lives in lib/sensitiveText.ts (Phase 2), unchanged, next to the "Needs reading" categories.
export const COMMENT_KEYWORDS = FLAG_RAISING_WORDS;

export function findCommentKeywords(comment: string): string[] {
  return COMMENT_KEYWORDS.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(comment));
}

export function applyExtraRules(s: Student, baseline: RuleOutcome): RuleOutcome {
  let outcome = baseline;

  // E1 — "Prefer not to say" on self-harm → at least High.
  // Why: under the baseline, 7 of the 8 students who skipped this question get None.
  // A skipped sensitive question is a signal worth a gentle check-in. Not Urgent,
  // because many students skip sensitive questions for privacy, not because of risk.
  if (skippedSelfHarm(s) && isLessSerious(outcome.level, "High")) {
    outcome = { level: "High", triggeredBy: ["skippedSelfHarm"] };
  }

  // E2 — Worrying words in the free-text comment → at least Review.
  // Why: the baseline ignores comments entirely, so "Sometimes I don't want to go
  // home" (S-023) gets None.
  if (hasWorryingComment(s) && isLessSerious(outcome.level, "Review")) {
    outcome = { level: "Review", triggeredBy: ["worryingComment"] };
  }

  return outcome;
}

// E3 — Missing or unreadable answers → "Needs check" badge (no level change).
// Why: missing data must never look like "fine". This is always on because it
// does not change any level, so it doesn't affect the baseline comparison.
export const needsCheck = (s: Student) => s.dataIssues.length > 0;

// ---------------------------------------------------------------------------
// 4. PUTTING IT TOGETHER
// ---------------------------------------------------------------------------

export interface Reason {
  id: ConditionId;
  text: string;
  primary: boolean; // true = this reason set the flag level (shown first, in bold)
  extra: boolean; // true = comes from our proposed rules, not the brief's baseline
}

export interface FlagResult {
  level: FlagLevel;
  baselineLevel: FlagLevel; // level under the brief's rules only, for comparison
  reasons: Reason[]; // EVERY condition met; primary reasons first
  needsCheck: boolean;
  commentKeywords: string[]; // which E2 words matched (empty if extras are off)
}

export interface FlagOptions {
  useExtraRules: boolean;
}

export function flagStudent(s: Student, options: FlagOptions = { useExtraRules: true }): FlagResult {
  const baseline = applyBaselineRules(s);
  const final = options.useExtraRules ? applyExtraRules(s, baseline) : baseline;

  // Show every condition the student meets, not just the one that set the level.
  const met = CONDITIONS.filter((c) => (options.useExtraRules || !c.extra) && c.check(s));
  const reasons: Reason[] = met.map((c) => ({
    id: c.id,
    text: REASON_TEXT[c.id],
    primary: final.triggeredBy.includes(c.id),
    extra: c.extra,
  }));
  // Primary reasons first; otherwise keep the display order above.
  reasons.sort((a, b) => Number(b.primary) - Number(a.primary));

  return {
    level: final.level,
    baselineLevel: baseline.level,
    reasons,
    needsCheck: needsCheck(s),
    commentKeywords: options.useExtraRules ? findCommentKeywords(s.comment) : [],
  };
}

/** Number of students at each level, e.g. { Urgent: 2, High: 9, ... }. */
export function countByLevel(results: { level: FlagLevel }[]): Record<FlagLevel, number> {
  const counts: Record<FlagLevel, number> = { Urgent: 0, High: 0, Review: 0, None: 0 };
  for (const r of results) counts[r.level] += 1;
  return counts;
}

// ---------------------------------------------------------------------------
// 5. CHECK-IN RULE (Phase 2, P-04), clearly labelled extra. It ADDS a reason, but NEVER changes
// the survey flag level: a check-in is a short pulse, not a survey, and the counsellor decides.
// ---------------------------------------------------------------------------

/** "Check-in: needs follow-up" if the student's LATEST check-in says "Not good" (1) or worried "Yes". */
export function checkInReasons(responses: { feeling: number | null; worry: string | null; createdAt: string }[]): Reason[] {
  const latest = [...responses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!latest || !(latest.feeling === 1 || latest.worry === "Yes")) return [];
  return [{ id: "checkInConcern", text: REASON_TEXT.checkInConcern, primary: false, extra: true }];
}
