import { describe, expect, it } from "vitest";
import { FEATURES, isEnabled } from "@/lib/features";

describe("feature switches (lib/features.ts)", () => {
  it("built features are on", () => {
    expect(isEnabled("interventions")).toBe(true);
    expect(isEnabled("needsReading")).toBe(true);
    expect(isEnabled("heatMap")).toBe(true);
    expect(isEnabled("studentPortal")).toBe(true);
    expect(isEnabled("messaging")).toBe(true);
    expect(isEnabled("checkIns")).toBe(true);
    expect(isEnabled("activities")).toBe(true);
    expect(isEnabled("journal")).toBe(true);
  });

  it("the peer board is OFF by default (optional, needs pre-moderation)", () => {
    expect(FEATURES.peerBoard).toBe(false);
  });
});
