import { describe, expect, it } from "vitest";
import { EMERGENCY, HELPLINE } from "@/lib/helpContacts";

// These numbers reach a child in crisis. They must only ever come from an official source,
// so a change here should be deliberate and re-checked (docs/RESEARCH.md).
describe("help contacts", () => {
  it("use the verified official numbers", () => {
    expect(HELPLINE.number).toBe("1098");
    expect(EMERGENCY.police).toBe("113");
    expect(EMERGENCY.ambulance).toBe("112");
  });
  it("cite official government sources", () => {
    expect(new URL(HELPLINE.source).hostname).toBe("thepema.gov.bt");
    expect(new URL(EMERGENCY.source).hostname).toBe("rbp.gov.bt");
  });
  it("describe the helpline in plain words a child can read", () => {
    expect(HELPLINE.description).toMatch(/free/i);
    expect(HELPLINE.description.split(/\s+/).length).toBeLessThan(20);
  });
});
