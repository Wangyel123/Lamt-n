import { describe, expect, it } from "vitest";
import { dz, en, translate } from "@/lib/i18n";

describe("UI labels in English and Dzongkha (AC-09)", () => {
  it("English is the default and fills in {placeholders}", () => {
    expect(translate("en", "board.urgentHeading", { n: 2 }).text).toBe("Urgent: see these students first (2)");
  });

  it("Dzongkha drafts are used where they exist and marked as Dzongkha", () => {
    expect(translate("dz", "filters.school")).toEqual({ text: "སློབ་གྲྭ", isDzongkha: true });
  });

  it("missing Dzongkha labels fall back to English, and are NOT marked as Dzongkha", () => {
    expect(translate("dz", "status.in_progress")).toEqual({ text: "In progress", isDzongkha: false });
  });

  it("every Dzongkha key also exists in English", () => {
    for (const key of Object.keys(dz)) expect(en).toHaveProperty(key);
  });

  it("Dzongkha drafts are written in Tibetan script (not transliteration)", () => {
    for (const [key, value] of Object.entries(dz)) {
      if (key !== "lang.switchTo") expect(value).toMatch(/^[ༀ-࿿\s]+$/);
    }
  });
});
