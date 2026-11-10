// Who a student can reach RIGHT NOW. One list, used by the public /help page and the
// "Get help now" sheet, so the two can never disagree.
//
// Every number here comes from an OFFICIAL source, checked on 2026-11-10 (see docs/RESEARCH.md).
// Never add a number that isn't from an official source. Re-check these every term.

export const HELPLINE = {
  name: "PEMA Helpline",
  number: "1098",
  /** Shown to students in plain words. From thepema.gov.bt: "24/7", "confidential and free", supports children. */
  description: "Free and private. Open day and night, every day. Trained people listen and help.",
  email: "helpline@thepema.gov.bt",
  source: "https://thepema.gov.bt/response-services",
} as const;

/** Royal Bhutan Police list of emergency numbers (rbp.gov.bt). */
export const EMERGENCY = {
  police: "113",
  ambulance: "112",
  source: "https://rbp.gov.bt/?p=9641",
} as const;

// TODO(confirm with CECD): each school's counsellor office, hours and how to reach them.
export const SCHOOL_COUNSELLOR_NOTE = "Your school counsellor can see you in school. Ask any teacher to help you find them.";
