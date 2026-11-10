import { describe, expect, it } from "vitest";
import { FEATURES, isEnabled } from "@/lib/features";

describe("feature switches (lib/features.ts)", () => {
  it("the student area is on (Step 1 built it)", () => {
    expect(isEnabled("studentPortal")).toBe(true);
  });

  it("features that are not built yet stay OFF, so nothing half-built reaches a child", () => {
    expect(FEATURES.messaging).toBe(false);
    expect(FEATURES.activities).toBe(false);
    expect(FEATURES.journal).toBe(false);
    expect(FEATURES.checkIns).toBe(false);
  });

  it("the peer board is OFF by default (optional, needs pre-moderation)", () => {
    expect(FEATURES.peerBoard).toBe(false);
  });
});
