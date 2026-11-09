// UI labels in English and Dzongkha (AC-09). Labels only: student answers, reasons and
// comments stay as they are.
//
// HONESTY RULE: the Dzongkha strings below are DRAFTS written without a native speaker.
// Every one is marked TODO(verify with native speaker). Any label without a Dzongkha
// entry falls back to English, and the app shows a visible "draft" notice in Dzongkha mode.
// Please do not present these as verified translations.

export type Lang = "en" | "dz";

export const en = {
  "app.name": "SA Wellbeing — Counsellor Board",
  "lang.notice": "Dzongkha labels are drafts and incomplete. They still need checking by a native speaker.",
  "lang.switchTo": "རྫོང་ཁ", // the button shows the OTHER language's name, in its own script
  "level.Urgent": "Urgent",
  "level.High": "High",
  "level.Review": "Review",
  "level.None": "None",
  "status.not_started": "Not started",
  "status.in_progress": "In progress",
  "status.closed": "Closed",
  "board.title": "Counsellor board",
  "board.screening":
    "Flags are a screening aid to help you decide who to meet first. They are not a diagnosis. Your professional judgement comes first.",
  "board.urgentHeading": "Urgent: see these students first ({n})",
  "board.others": "All other students ({n})",
  "board.othersFiltered": "Other matching students ({n})",
  "filters.search": "Search ID",
  "filters.school": "School",
  "filters.class": "Class",
  "filters.level": "Flag level",
  "filters.followUp": "Follow-up",
  "filters.allSchools": "All schools",
  "filters.allClasses": "All classes",
  "filters.allLevels": "All levels",
  "filters.anyStatus": "Any status",
  "filters.clear": "Clear filters",
  "filters.open": "Filters",
  "action.signOut": "Sign out",
  "action.switchRole": "Switch role",
  "action.addFollowUp": "Add follow-up anyway",
  "action.closeCase": "Close case",
  "action.cancel": "Cancel",
  "action.saveNote": "Save note",
  "action.done": "Done",
  "supervisor.title": "Supervisor view",
  "supervisor.privacy": "Counts only. No student can be identified from this page. Groups under {n} are hidden.",
  "supervisor.chartTitle": "Flag levels by school",
  "table.schoolClass": "School / class",
  "table.total": "Total",
} as const;

export type LabelKey = keyof typeof en;

// Draft Dzongkha. Only words we are reasonably confident about; everything else falls back to English.
export const dz: Partial<Record<LabelKey, string>> = {
  "lang.switchTo": "English",
  "level.Urgent": "འཕྲལ་མཐུད", // TODO(verify with native speaker)
  "filters.school": "སློབ་གྲྭ", // TODO(verify with native speaker)
  "filters.class": "འཛིན་གྲྭ", // TODO(verify with native speaker)
  "filters.allSchools": "སློབ་གྲྭ་ཆ་མཉམ", // TODO(verify with native speaker)
  "filters.allClasses": "འཛིན་གྲྭ་ཆ་མཉམ", // TODO(verify with native speaker)
  "table.total": "བསྡོམས", // TODO(verify with native speaker)
};

/**
 * The label for `key` in `lang`, with {placeholders} filled in.
 * `isDzongkha` tells the caller whether the text really is Dzongkha (for the lang attribute
 * and the Tibetan-script font), since missing entries fall back to English.
 */
export function translate(lang: Lang, key: LabelKey, vars: Record<string, string | number> = {}) {
  const draft = lang === "dz" ? dz[key] : undefined;
  let text: string = draft ?? en[key];
  for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return { text, isDzongkha: draft !== undefined && key !== "lang.switchTo" };
}
