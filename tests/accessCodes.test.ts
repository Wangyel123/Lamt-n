import { describe, expect, it } from "vitest";
import {
  checkRedeem,
  CODE_ALPHABET,
  codeStatus,
  generateCode,
  newAccessCode,
  normaliseCode,
  REDEEM_MESSAGES,
  type AccessCode,
} from "@/lib/accessCodes";

const NOW = new Date("2026-11-10T09:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const code = (overrides: Partial<AccessCode> = {}): AccessCode => ({ ...newAccessCode("S-012", NOW, () => "GK-7Q4M"), ...overrides });

describe("generating codes", () => {
  it("never uses characters that are easy to confuse on paper (0/O, 1/I/L)", () => {
    for (const ch of "0O1IL") expect(CODE_ALPHABET).not.toContain(ch);
    expect(CODE_ALPHABET).toHaveLength(31);
  });

  it("looks like XX-XXXX and only uses the safe alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const c = generateCode();
      expect(c).toMatch(/^[A-Z2-9]{2}-[A-Z2-9]{4}$/);
      for (const ch of c.replace("-", "")) expect(CODE_ALPHABET).toContain(ch);
    }
  });

  it("is effectively unique (1,000 codes, no repeats)", () => {
    expect(new Set(Array.from({ length: 1000 }, () => generateCode())).size).toBe(1000);
  });

  it("throws away biased bytes (248–255) instead of skewing the alphabet", () => {
    // First batch is all 255s (all rejected), then all zeros → every character is the first letter.
    const batches = [new Uint8Array(12).fill(255), new Uint8Array(12).fill(0)];
    expect(generateCode(() => batches.shift() ?? new Uint8Array(12))).toBe("AA-AAAA");
  });
});

describe("tidying what a student types", () => {
  it("accepts lower case, spaces and a missing dash", () => {
    expect(normaliseCode("gk-7q4m")).toBe("GK-7Q4M");
    expect(normaliseCode(" GK 7Q4M ")).toBe("GK-7Q4M");
    expect(normaliseCode("gk7q4m")).toBe("GK-7Q4M");
  });

  it("rejects wrong lengths and confusable characters", () => {
    expect(normaliseCode("GK-7Q4")).toBeNull();
    expect(normaliseCode("GK-7Q4MM")).toBeNull();
    expect(normaliseCode("GO-7Q4M")).toBeNull(); // O is never used
    expect(normaliseCode("G0-7Q4M")).toBeNull(); // nor 0
  });
});

describe("expiry, single use and revocation", () => {
  it("a new code lasts 14 days", () => {
    const c = code();
    expect(new Date(c.expiresAt).getTime() - NOW.getTime()).toBe(14 * DAY);
    expect(codeStatus(c, NOW)).toBe("active");
    expect(codeStatus(c, new Date(NOW.getTime() + 14 * DAY))).toBe("expired");
  });

  it("works once only", () => {
    expect(codeStatus(code({ usedAt: NOW.toISOString() }), NOW)).toBe("used");
  });

  it("can be revoked by the counsellor, and revoked wins over everything", () => {
    expect(codeStatus(code({ revokedAt: NOW.toISOString(), usedAt: NOW.toISOString() }), NOW)).toBe("revoked");
  });
});

describe("redeeming (demo mode; Postgres does the same in live mode)", () => {
  it("accepts an active code however it was typed", () => {
    const result = checkRedeem("gk 7q4m", [code()], NOW);
    expect(result.ok && result.code.studentId).toBe("S-012");
  });

  it("gives ONE kind message for unknown, used, expired and revoked codes (no probing)", () => {
    const later = new Date(NOW.getTime() + 15 * DAY);
    for (const [codes, when] of [
      [[], NOW],
      [[code({ usedAt: NOW.toISOString() })], NOW],
      [[code()], later],
      [[code({ revokedAt: NOW.toISOString() })], NOW],
    ] as [AccessCode[], Date][]) {
      expect(checkRedeem("GK-7Q4M", codes, when)).toEqual({ ok: false, message: REDEEM_MESSAGES.invalid });
    }
  });

  it("explains the format if the typed text can't be a code", () => {
    expect(checkRedeem("hello", [code()], NOW)).toEqual({ ok: false, message: REDEEM_MESSAGES.format });
  });
});
