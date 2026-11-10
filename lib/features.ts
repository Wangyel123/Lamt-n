// Feature switches for Phase 2 (Kooth- and Panorama-inspired features).
// ONE place to turn a feature on or off before submission: change true/false and redeploy.
// Anything not finished stays OFF, so a half-built feature can never appear in front of a child.

export const FEATURES = {
  /** K-01/K-05: the student area at /student (About this space, Get help now). */
  studentPortal: true,
  /** K-02: "Talk to my counsellor" messaging. */
  messaging: true,
  /** K-03: self-care activities library. */
  activities: true,
  /** K-04: private journal and goals. */
  journal: true,
  /** P-04: short check-ins between surveys. */
  checkIns: true,
  /** K-06: pre-moderated peer board. Optional; default OFF. */
  peerBoard: false,
} as const;

export type FeatureName = keyof typeof FEATURES;

export const isEnabled = (feature: FeatureName): boolean => FEATURES[feature];
