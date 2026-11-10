// P-02: finding free text a counsellor should read (survey comments, messages, check-in comments,
// shared journal entries, peer-board posts). Pure functions.
//
// HONESTY: this is keyword matching. It can miss things and can match innocently. It only ever
// says "needs reading"; a counsellor reads the words in context and decides. It never changes a
// flag level by itself (except the original E2 words below, which were part of the Phase 1 rules).

export type SensitiveCategory = "self_harm" | "abuse_violence" | "bullying" | "home_safety" | "distress";

export const KEYWORD_NOTICE = "Keyword matching: may miss things or match innocently. Always read in context.";

// Each category: a plain-language label and an editable list of words or short phrases.
export const CATEGORIES: Record<SensitiveCategory, { short: string; label: string; words: string[] }> = {
  self_harm: {
    short: "self-harm",
    label: "May mention self-harm or not wanting to live",
    words: ["kill myself", "hurt myself", "harm myself", "cut myself", "end my life", "want to die", "wish i was dead", "suicide", "self-harm", "self harm", "no reason to live"],
  },
  abuse_violence: {
    short: "violence or abuse",
    label: "May mention violence or abuse",
    words: ["hit", "hits", "hitting", "beat", "beats", "beaten", "kick", "kicks", "slap", "slapped", "punch", "punched", "abuse", "abused", "hurt me", "hurts me"],
  },
  bullying: {
    short: "bullying",
    label: "May mention bullying",
    words: ["bully", "bullies", "bullied", "bullying", "tease", "teased", "teasing", "mean to me", "laugh at me", "laughs at me", "left out"],
  },
  home_safety: {
    short: "safety at home",
    label: "May mention not feeling safe at home",
    words: ["don't want to go home", "dont want to go home", "not safe at home", "unsafe", "scared at home", "afraid at home", "scared to go home", "afraid to go home"],
  },
  distress: {
    short: "worry or sadness",
    label: "May show strong worry or sadness",
    words: ["alone", "lonely", "hopeless", "worthless", "nobody cares", "no one cares", "scared", "afraid", "crying"],
  },
};

/**
 * The words that RAISE a survey comment to at least Review (extra rule E2 in lib/flags.ts).
 * Unchanged from Phase 1 on purpose: widening it would change who is flagged (the brief's
 * counts 2/17/17/36). The categories above only add "Needs reading" chips.
 */
export const FLAG_RAISING_WORDS = ["home", "hit", "hurt", "scared", "afraid", "unsafe", "alone", "die", "kill", "beat"];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Curly apostrophes (’) are common on phones; treat them like straight ones.
const tidy = (text: string) => text.replace(/[‘’]/g, "'");

/** Which of `words` appear as whole words or phrases ("hit" never matches "white" or "this"). */
export function matchWords(text: string, words: string[]): string[] {
  const t = tidy(text);
  return words.filter((w) => new RegExp(`(^|[^\\w'])${escape(tidy(w))}(?=$|[^\\w'])`, "i").test(t));
}

export interface Match {
  category: SensitiveCategory;
  label: string;
  words: string[];
}

export function scanText(text: string): Match[] {
  if (!text.trim()) return [];
  return (Object.keys(CATEGORIES) as SensitiveCategory[])
    .map((category) => ({ category, label: CATEGORIES[category].label, words: matchWords(text, CATEGORIES[category].words) }))
    .filter((m) => m.words.length > 0);
}

/** Where a piece of text came from. A journal entry says whether the student chose to share it. */
export type TextSource =
  | { kind: "survey_comment" | "message" | "checkin" | "board_post"; text: string }
  | { kind: "journal"; text: string; shared: boolean };

/**
 * What a counsellor may be alerted to. A PRIVATE journal entry is NEVER scanned: scanning
 * private writing would be surveillance and would break the promise on the student's About page.
 */
export function scanForCounsellor(source: TextSource): Match[] {
  if (source.kind === "journal" && !source.shared) return [];
  return scanText(source.text);
}

/** Matches that should raise an in-app alert immediately (and a caring reply to the student). */
export const ALERT_CATEGORIES: SensitiveCategory[] = ["self_harm", "abuse_violence"];
export const needsAlert = (matches: Match[]) => matches.some((m) => ALERT_CATEGORIES.includes(m.category));
