import { describe, expect, it } from "vitest";
import { FEATURES, isEnabled } from "@/lib/features";

describe("feature switches (lib/features.ts)", () => {
  it("built features are on", () => {
    expect(isEnabled("studentPortal")).toBe(true);
    expect(isEnabled("messaging")).toBe(true);
    expect(isEnabled("checkIns")).toBe(true);
  });

  it("features that are not built yet stay OFF, so nothing half-built reaches a child", () => {
    expect(FEATURES.activities).toBe(false);
    expect(FEATURES.journal).toBe(false);
  });

  it("the peer board is OFF by default (optional, needs pre-moderation)", () => {
    expect(FEATURES.peerBoard).toBe(false);
  });
});
